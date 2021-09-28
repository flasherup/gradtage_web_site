import * as d3 from 'd3';
import * as topojson from "topojson-client";
import versor from "versor";
import {HOURS_ACCEPTABLE_GAP, HOURS_THRESHOLD} from "../../../constants";


const SCALE_EXTENT = [1, 70];

const COLOR_NORMAL = '#31C52E';
const COLOR_ISSUE = '#C5402E';

const SCALE_STATION_MODE = 3000;

export default class MapD3 {
    constructor(parent) {
        this.parent = parent;
        this.countryMode = true;
    }

    initialize() {
        const svg = d3.select(this.parent);
        const projection = d3.geoOrthographic();
        const path = d3.geoPath(projection);
        const mapContainer = svg.append('g');
        const itemContainer = svg.append('g');

        const scaleColor = d3.scaleLinear().domain([0, HOURS_THRESHOLD])
            .range([COLOR_NORMAL, COLOR_ISSUE])


        this.svg = svg;
        this.projection = projection;
        this.mapContainer = mapContainer;
        this.itemContainer = itemContainer;
        this.path = path;
        this.scaleColor = scaleColor;

        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
            .then(data => this.onCountryJSONReady(data));

        this.updateSize();
    }

    updateSize() {
        const width = this.parent.clientWidth;
        const height = this.parent.clientHeight;

        this.projection
            .scale(250)
            .translate([width / 2, height / 2])
            .clipExtent([[0,0],[width,height]]);

        this.width = width;
        this.height = height;
    }

    onCountryJSONReady(data) {
        const {
            svg,
            path,
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
                .on("zoom.render", event => this.render(countries, event)))
            .call(event => this.render(countries, event))
            .node();

        this.countries = countries;
        this.initialized = true;
        if (this.countriesRawData) this.drawCountries();
    }

    render(countries, event) {
        if (event.transform && event.transform.k > SCALE_STATION_MODE) {
            if (this.countryMode) {
                this.cleanCountries()
            }
            this.countryMode = false;
        } else {
            this.countryMode = true;
        }
        const { mapContainer, path, countriesData, stationsRawData } = this;

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

        if (this.countryMode) {
            this.updateCountries(countriesData);
        } else {
            this.updateStations(stationsRawData);
        }
    }

    update(countries, all) {
        this.countriesRawData = countries;
        this.stationsRawData = all;
        if (!this.initialized) {
            return
        }

        this.drawCountries();
    }

    drawCountries() {
        const {countries, countriesRawData} = this;
        const features = countries.features;
        const countriesData = [];
        features.forEach( (feature) => {
            const d = countriesRawData.get(feature.properties.name)
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
        this.updateCountries(countriesData);
    }

    updateCountries(data) {
        const { itemContainer, projection} = this;
        if (!data) return;
        if (!this.countryItems) this.countryItems = itemContainer.selectAll(".country");
        const filtered = data.filter(tester(projection));
        this.countryItems = this.countryItems.data(filtered)
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

    cleanCountries() {
        this.itemContainer.selectAll(".country").remove();
        this.stationItems = null;
    }

    updateStations(data) {
        const { itemContainer, projection} = this;
        if (!data) return;
        if (!this.stationItems) this.stationItems = itemContainer.selectAll(".country");
        const filtered = data.filter(tester(projection));
        this.stationItems = this.stationItems.data(filtered)
            .join(
                enter => {
                    enter.append('g')
                        .attr("class", d=>{
                            return "country";
                        }).call((selection)=>processStationItem(selection, projection))
                },
                update => {
                    update.call((selection)=>processStationItem(selection, projection))
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
        .outerRadius(10);

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
            .attr('class', 'background');


         const pieChart = node.selectAll('.pie-chart').data([data]);

         const haveIssues = data.Raw.Updates.Issues > 0

        pieChart.select('.background')
            .attr('r', 4)
            .attr('fill', haveIssues ? COLOR_ISSUE : COLOR_NORMAL)
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 2);

         const pieData = pie([data.Raw.Records.Normals, data.Raw.Records.Issues])

        pieChart.selectAll('.arc')
            .data(pieData)
            .join(
                enter => {
                    enter
                        .append("path")
                        .attr("class", "arc")
                        .attr("fill", (d, i) => {
                            return i === 0 ? COLOR_NORMAL : COLOR_ISSUE;
                        })
                        .attr("d", arc)
                },
                update => {
                    update
                        .attr("fill", (d, i) => {
                            return i === 0 ? COLOR_NORMAL : COLOR_ISSUE;
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

const processStationItem = (selection, projection) => {
    selection
        .attr('transform', d => translate(d,projection));



    selection.each((data, i, nodes) => {
        //const haveIssues = (data.RecordsStatus > 0);
        const haveIssues = (data.RecordsStatus > 0 || data.UpdateStatus > HOURS_ACCEPTABLE_GAP);
        const node = d3.select(nodes[i]);
        node.selectAll('.pie-chart')
            .data([data])
            .enter()
            .append('g')
            .attr("class", 'pie-chart')
            .append('circle')
            .attr('class', 'background')

        const pieChart = node.selectAll('.pie-chart').data([data]);
        pieChart.select('.background')
            .attr('r', () => haveIssues ? 10 : 5)
            .attr('fill', haveIssues ? COLOR_ISSUE : COLOR_NORMAL)
            .attr('stroke', '#446380')
            .attr('stroke-width', 2);
    });

    return selection;
}

const MAX_GAPS = 100;
const getRecordsIssuePercent = gaps => {
    if (gaps >= MAX_GAPS) {
        return 1;
    }

    return gaps/MAX_GAPS;
}

const translate = (item, projection) => {
    const pos = projection([item.Longitude, item.Latitude]);
    return `translate(${pos[0]},${pos[1]})`;
}


function zoom(projection) {
    const scale = projection._scale === undefined
        ? (projection._scale = projection.scale())
        : projection._scale;

    let v0, q0, r0, a0, tl;

    const zoom = d3.zoom()
        .scaleExtent(SCALE_EXTENT.map(x => x * scale))
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
