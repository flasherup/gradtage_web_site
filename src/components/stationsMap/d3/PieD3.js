import * as d3 from 'd3';
import {HOURS_THRESHOLD} from "../../../constants";
export default class PieD3 {
    constructor(parent) {
        this.parent = parent;
    }

    initialize() {
        const svg = d3.select(this.parent);
        const width = +svg.attr("width");
        const height = +svg.attr("height");

        const radius = Math.min(width, height) / 2;

        var pie = d3.pie()
            .value(function(d) { return d.count; })
            .sort(null);

        var arc = d3.arc()
            .innerRadius(radius - 100)
            .outerRadius(radius - 20);


        this.svg = svg;
        this.width = width;
        this.height = height;
    }



    update(data) {
    }

    dispose() {
        d3.selectAll("svg > *").remove();
    }
}