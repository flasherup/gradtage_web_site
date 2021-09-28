import * as d3 from 'd3';
import * as topojson from "topojson-client";
import {HOURS_THRESHOLD} from "../../../constants";
import versor from "versor";

const COLOR_NORMAL = '#31C52E';
const COLOR_ISSUE = '#C5402E';

export default class MapD3 {
    constructor(parent) {
        this.parent = parent;
    }

    initialize() {
        const svg = d3.select(this.parent);
        const width = +svg.attr("width");
        const height = +svg.attr("height");
        const projection = d3.geoOrthographic()
            .scale(250)
            .translate([width / 2, height / 2])
            .clipExtent([[0,0],[width,height]]);
        const path = d3.geoPath(projection);
        const mapContainer = svg.append('g');
        const itemContainer = svg.append('g');

        const scaleColor = d3.scaleLinear().domain([0, HOURS_THRESHOLD])
            .range([COLOR_NORMAL, COLOR_ISSUE])


        this.svg = svg;
        this.width = width;
        this.height = height;
        this.projection = projection;
        this.mapContainer = mapContainer;
        this.itemContainer = itemContainer;
        this.path = path;
        this.scaleColor = scaleColor;

        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
            .then(data => this.onCountryJSONReady(data));
    }

    onCountryJSONReady(data) {
        const {
            svg,
            path,
            width,
            height,
            mapContainer,
            projection,
        } = this;

        const countries = topojson.feature(data, data.objects.countries);
        mapContainer
            .selectAll('path')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
            .style("stroke", "transparent")
            .style("fill", "#88A5BD")
            .attr("class", "Country")
            .style("opacity", .8)

        const extraSpace = 10;
        const scale = projection._scale === undefined
            ? (projection._scale = projection.scale())
            : projection._scale;
        svg
            .call(zoom(projection)
                .on("zoom.render", () => this.render(countries)))
            .call(() => this.render(countries))
            .node();

        this.countries = countries;
        this.initialized = true;
        if (this.data) this.drawCountries();
    }

    render(countries) {
        const { mapContainer, path, projection } = this;

        if (!this.paths) this.paths = mapContainer.selectAll('path')

        this.paths = this.paths
            .data(countries.features)
            .join(
                enter => enter.append("path")
                    .attr('d', path),
                update => update
                    .attr('d', path),
                exit => exit
                    .remove()
            )
            .attr('class', 'country')
            .style("stroke", "transparent")
            .style("fill", "#88A5BD")
            .attr("class", "Country")
            .style("opacity", .8)

        this.updateItems(this.countriesData);
    }

    update(data) {
        this.data = data;
        if (!this.initialized) {
            return
        }

        this.drawCountries();
    }

    drawCountries() {
        const {countries, path, data} = this;
        const features = countries.features;
        const countriesData = [];
        features.forEach( (feature) => {
            const d = data.get(feature.properties.name)
            if (d) {
                const c = d3.geoCentroid(feature)
                countriesData.push({
                    Longitude:c[0],
                    Latitude:c[1],
                    Name: d.Name,
                    Raw: d,
                })
            }
        });

        this.countriesData = countriesData;
        this.updateItems(countriesData);
    }

    updateItems(data) {
        const { itemContainer, projection} = this;
        if (!data) return;
        if (!this.items) this.items = itemContainer.selectAll(".country");
        const filtered = data.filter(tester(projection));
        this.items = this.items.data(filtered)
            .join(
                enter => {
                    enter.append('g')
                        .attr("class", d=>{
                            return "country";
                        }).call((selection)=>processCountryItem(selection, projection))
                },
                update => {
                    update.call((selection)=>processCountryItem(selection, projection))
                },
                exit => {
                    exit
                        .remove();
                }
            )
    }

    dispose() {
        d3.selectAll("svg > *").remove();
    }
}

const processCountryItem = (selection, projection) => {
// Compute the position of each group on the pie:

    const pie = d3.pie()

    const arc = d3.arc()
        .innerRadius(4)
        .outerRadius(8);

    selection
        .attr('transform', d => translate(d,projection));


    selection.each((data, i, nodes) => {
        const node = d3.select(nodes[i]);
        node.selectAll('.pie-chart')
            .data([data])
            .enter()
            .append('g')
            .attr("class", 'pie-chart')
            .append('circle')
            .attr('class', 'background')
            .attr('r', 10)
            .attr('fill', '#FFFFFF')
            .attr('stroke', '#446380')
            .attr('stroke-width', 2);

         const pieChart = node.selectAll('.pie-chart').data([data]);

         const pieData = pie([data.Raw.Records.Normals, data.Raw.Records.Issues])

        pieChart.selectAll('.arc')
            .data(pieData)
            .join(
                enter => {
                    enter
                        .append("path")
                        .attr("class", "arc")
                        .attr("fill", (d, i) => {
                            const color = i===0?COLOR_NORMAL:COLOR_ISSUE;
                            return color;
                        })
                        .attr("d", arc)
                },
                update => {
                    update
                        .attr("fill", (d, i) => {
                            const color = i===0?COLOR_NORMAL:COLOR_ISSUE;
                            return color;
                        })
                        .attr("d", arc)
                },
                exit => {
                    exit
                        .remove();
                }
            )
    })
    return selection;
}

const translate = (item, projection) => {
    const pos = projection([item.Longitude, item.Latitude]);
    return `translate(${pos[0]},${pos[1]})`;
}


function zoom(projection) {
    const scale = projection._scale === undefined
        ? (projection._scale = projection.scale())
        : projection._scale;

    const scaleExtent = [0.8, 8]
    let v0, q0, r0, a0, tl;

    const zoom = d3.zoom()
        .scaleExtent(scaleExtent.map(x => x * scale))
        .on("start", zoomstarted)
        .on("zoom", zoomed);

    function point(event, that) {
        const t = d3.pointers(event, that);

        if (t.length !== tl) {
            tl = t.length;
            if (tl > 1) a0 = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
            zoomstarted.call(that, event);
        }

        return tl > 1
            ? [
                d3.mean(t, p => p[0]),
                d3.mean(t, p => p[1]),
                Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0])
            ]
            : t[0];
    }

    function zoomstarted(event) {
        v0 = versor.cartesian(projection.invert(point(event, this)));
        q0 = versor((r0 = projection.rotate()));
    }

    function zoomed(event) {
        projection.scale(event.transform.k);
        const pt = point(event, this);
        const v1 = versor.cartesian(projection.rotate(r0).invert(pt));
        const delta = versor.delta(v0, v1);
        let q1 = versor.multiply(q0, delta);

        if (pt[2]) {
            const d = (pt[2] - a0) / 2;
            const s = -Math.sin(d);
            const c = Math.sign(Math.cos(d));
            q1 = versor.multiply([Math.sqrt(1 - s * s), 0, 0, c * s], q1);
        }

        projection.rotate(versor.rotation(q1));

        if (delta[0] < 0.7) zoomstarted.call(this, event);
    }

    return Object.assign(selection => selection
        .property("__zoom", d3.zoomIdentity.scale(projection.scale()))
        .call(zoom), {
        on(type, ...options) {
            return options.length
                ? (zoom.on(type, ...options), this)
                : zoom.on(type);
        }
    });
}

function tester(projection) {
    let visible;
    const stream = projection.stream({point() { visible = true; }});
    return (item) => {
        visible = false;
        stream.point(item.Longitude, item.Latitude);
        return visible
    };
}
