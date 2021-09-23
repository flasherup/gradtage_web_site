import * as d3 from 'd3';
import * as topojson from "topojson-client";
export default class MapD3 {
    constructor(parent) {
        this.parent = parent;
    }

    initialize() {
        const svg = d3.select(this.parent);
        const width = +svg.attr("width");
        const height = +svg.attr("height");
        const projection = d3.geoMercator()
            .scale(100)
            .translate([width / 2, height / 1.4]);
        const path = d3.geoPath(projection);
        const mapContainer = svg.append('g');
        const itemContainer = svg.append('g');


        this.svg = svg;
        this.width = width;
        this.height = height;
        this.projection = projection;
        this.mapContainer = mapContainer;
        this.itemContainer = itemContainer;
        this.path = path;

        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
            .then(data => this.onCountryJSONReady(data));

        /*setTimeout(()=>{
            const scale = 5;
            const p = projection([itemData[1].lon,itemData[1].lat]);
            var t = d3.zoomIdentity.translate(width / 2 - p[0] * scale, height / 2 - p[1] * scale).scale(scale);
            svg.call(zoom.transform, t);
        }, 500)*/



    }

    onCountryJSONReady(data) {
        const {
            svg,
            path,
            width,
            height,
            itemContainer,
            mapContainer,
            projection
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
            .attr("class", "Country" )
            .style("opacity", .8)

        const extraSpace = 60;
        const zoom = d3.zoom()
            .scaleExtent([1, 50])  // This control how much you can unzoom (x0.5) and zoom (x20)
            .extent([[0, 0], [width, height]])
            .translateExtent([[-extraSpace, 0], [width + extraSpace, height]])
            .on("zoom", e=>zoomed(e, mapContainer, itemContainer, projection));
        svg.call(zoom);

        this.countries = countries;
        this.initialized = true;
        if (this.data) this.drawCountries();
    }

    update(data) {
        this.data = data;
        if (!this.initialized) {
            return
        }

        this.drawCountries();
    }

    drawCountries() {
        const { data, itemContainer, countries, path, projection } = this;

        /*const centroids = countries.features.map(function (feature){
            return path.centroid(feature);
        });

        itemContainer.selectAll(".centroid").data(centroids)
            .enter().append("circle")
            .attr("class", "centroid")
            .attr("fill", '#69a3b2')
            .attr("stroke", 1)
            .attr("r", 1)
            .attr("cx", function (d){ return d[0]; })
            .attr("cy", function (d){ return d[1]; });*/

        console.log('data', data)

        const myColor = d3.scaleLinear().domain([1,20])
            .range(['#31C52E', '#C5402E'])

        const items = itemContainer.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr("r", 0.5)
            .attr('stroke', 1)
            //.attr('fill', d=>myColor(d.UpdateStatus))
            .attr('fill', d=>myColor(d.RecordsStatus))
            .attr("cx", d=> projection([d.Longitude,d.Latitude])[0])
            .attr("cy", d=> projection([d.Longitude,d.Latitude])[1])

    }

    dispose() {
        d3.selectAll("svg > *").remove();
    }
}

const mouseOver = d => {
    d3.selectAll(".Country")
        .transition()
        .duration(200)
        .style("opacity", .5)
    d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("stroke", "black")
}

const mouseLeave = d => {
    d3.selectAll(".Country")
        .transition()
        .duration(200)
        .style("opacity", .8)
    d3.select(this)
        .transition()
        .duration(200)
        .style("stroke", "transparent")
}

const zoomed = (event, countries, itemContainer, projection) => {
    console.log('Zoomed', event)
    countries
        .attr('transform', event.transform);

    const itemsTransform = Object.assign(Object.create(Object.getPrototypeOf(event.transform)), event.transform)
    //const itemsTransform = {...event.transform}
    console.log('itemsTransform', itemsTransform);
    //itemsTransform.x /= itemsTransform.k
    //itemsTransform.y /= itemsTransform.k
    //itemsTransform.k = 1;

    //console.log("apply", itemsTransform.apply())
    const t = itemsTransform.scale(1/itemsTransform.k)
    console.log('t', t);

    itemContainer.attr('transform', itemsTransform)
    /*items
        .attr('transform', itemsTransform)
        .attr('r', 10/itemsTransform.k)
        .attr('stroke', 1/itemsTransform.k);*/
}