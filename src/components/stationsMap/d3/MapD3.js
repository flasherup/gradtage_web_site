import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import versor from 'versor';
import Tooltip, {TYPE_STATION, TYPE_COUNTRY} from './elements/Tooltip'
import {HOURS_THRESHOLD} from '../../../constants';
import Country from "./elements/Country";
import Station from "./elements/Station";
import ItemsBuffer from "./utils/ItemsBuffer";

const SCALE_EXTENT = [1, 100];

const COLOR_NORMAL = '#31C52E';
const COLOR_ISSUE = '#C5402E';

const SCALE_STATION_MODE = 4000;

const TOOLTIP_WIDTH = 300;
const TOOLTIP_HEIGHT = 150;

export default class MapD3 {
    constructor(parent) {
        this.parent = parent;
        this.countryMode = true;
    }

    initialize() {
        const svg = d3.select(this.parent);
        const projection = d3.geoOrthographic();
        const path = d3.geoPath(projection);
        const scaleColor = d3.scaleLinear().domain([0, HOURS_THRESHOLD])
            .range([COLOR_NORMAL, COLOR_ISSUE])


        this.svg = svg;
        this.projection = projection;
        this.mapContainer = svg.append('g');
        this.itemContainer = svg.append('g');
        this.tooltipContainer = svg.append('g');
        this.path = path;
        this.scaleColor = scaleColor;

        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
            .then(data => this.onCountryJSONReady(data));

        this.tooltip = new Tooltip(this.tooltipContainer, TOOLTIP_WIDTH, TOOLTIP_HEIGHT);
        this.updateSize();
        this.initializeItemBuffers()
    }

    updateSize() {
        const width = this.parent.clientWidth;
        const height = this.parent.clientHeight;

        this.projection
            .scale(250)
            .translate([width / 2, height / 2])
            .clipExtent([[0,0],[width,height]]);

        this.tooltip.setPosition(width-TOOLTIP_WIDTH-2, height-TOOLTIP_HEIGHT-2);

        this.width = width;
        this.height = height;
    }

    initializeItemBuffers() {
        const { itemContainer } = this;
        this.countriesBuffer = new ItemsBuffer(
            ()=>{
                return new Country(
                    itemContainer,
                    10,
                    10,
                    (event, data)=>this.onMouseOver(event, data, TYPE_COUNTRY),
                    (event, data)=>this.onMouseOut(event, data, TYPE_COUNTRY)
                );
            }
        );

        this.stationsBuffer = new ItemsBuffer(
            ()=>{
                return new Station(
                    itemContainer,
                    10,
                    10,
                    (event, data)=>this.onMouseOver(event, data, TYPE_STATION),
                    (event, data)=>this.onMouseOut(event, data, TYPE_STATION)
                );
            }
        );
    }



    showTooltip(data, type) {
        const { tooltip } = this;
        tooltip.update(data, type);
    }

    hideTooltip(type) {
        //tooltip.update(data, TYPE_COUNTRY);
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

        svg
            .call(zoom(projection)
                .on("zoom.render", event => this.render(countries, event)))
            .call(event => this.render(countries, event))
            .node();

        this.countries = countries;
        this.initialized = true;
        if (this.countriesRawData) this.updateCountries(this.countriesRawData);
    }

    render(countries, event) {
        if (event.transform && event.transform.k > SCALE_STATION_MODE) {
            if (this.countryMode) {
                this.cleanCountries()
            }
            this.countryMode = false;
        } else {
            if (!this.countryMode) {
                this.cleanStations()
            }
            this.countryMode = true;
        }
        const { mapContainer, path, countriesRawData, stationsRawData } = this;

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
            this.updateCountries(countriesRawData);
        } else {
            this.updateStations(stationsRawData);
        }
    }

    update(countries, all, flags) {
        this.flags = flags;
        this.countriesRawData = countries;
        this.stationsRawData = all;
        if (!this.initialized) {
            return
        }

        //this.setupCountries();
        this.updateCountries(this.countriesRawData);
    }

    /*setupCountries() {
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
    }*/

    onMouseOver(event, data, type) {
        this.showTooltip(data, type);
    }

    onMouseOut(event, data, type) {
        this.hideTooltip(type);
    }

    onMouseClick(event, data, type) {

    }

    updateCountries(data) {
        if (!data) return;
        const { countriesBuffer, projection } = this;
        const filtered = data.filter(tester(projection));
        const {buffer, thresh} = countriesBuffer.update(filtered, 'Name');
        filtered.forEach(country=>{
            const icon = buffer.get(country.Name);
            icon.update(country);
            icon.transform(translate(country,projection));
        });

        thresh.forEach(icon=> {
            icon.dispose();
        })
    }

    cleanCountries() {
        const thresh = this.countriesBuffer.clean();
        thresh.forEach(icon=> {
            icon.dispose();
        })
    }

    updateStations(data) {
        if (!data) return;
        const { stationsBuffer, projection} = this;
        const filtered = data.filter(tester(projection));
        const {buffer, thresh} = stationsBuffer.update(filtered, 'StationId');
        filtered.forEach(station=>{
            const icon = buffer.get(station.StationId);
            icon.update(station);
            icon.transform(translate(station,projection));
        });

        thresh.forEach(icon=> {
            icon.dispose();
        })
        /*const { itemContainer, projection, stationIcons} = this;
        const filtered = data.filter(tester(projection));
        const save = new Map();
        filtered.forEach(station=>{
            let icon = stationIcons.get(station.Name);
            save.set(station.Name, true);
            if (!icon) {
                icon = new Station(
                    itemContainer,
                    10,
                    10,
                    (event, data)=>this.onMouseOver(event, data, TYPE_STATION),
                    (event, data)=>this.onMouseOut(event, data, TYPE_STATION)
                );
                stationIcons.set(station.Name, icon);
            }

            icon.update(station);
            icon.transform(translate(station,projection));
        });
        this.stationIcons = cleanIcons(stationIcons, save);*/
    }

    getFlag(country) {
        const { flags } = this;

        let flag = flags.get(country)
        if (flag && flag.flag_base64) {
            return flag.flag_base64;
        }

        return null;
    }

    cleanStations() {
        const thresh = this.stationsBuffer.clean();
        thresh.forEach(icon=> {
            icon.dispose();
        })
    }

    dispose() {
        d3.selectAll("svg > *").remove();
    }
}

const cleanIcons = (list, save) => {
    list.forEach((icon, key) => {
        if (!save || !save.has(key)) {
            icon.dispose();
            list.delete(key);
        }
    });

    return list;
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
