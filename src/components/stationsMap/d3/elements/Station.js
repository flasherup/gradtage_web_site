import * as d3 from "d3";
import {HOURS_ACCEPTABLE_GAP} from "../../../../constants";

const COLOR_NORMAL = '#31C52E';
const COLOR_ISSUE = '#C5402E';

export default class Station {
    constructor(parent, width, height, onOver, onOut) {
        this.parent = parent;
        this.width = width;
        this.height = height;
        this.onOver = onOver;
        this.onOut = onOut;
        this.initialize();
    }

    initialize() {
        const { parent } = this;
        const station = parent
            .append('g')
            .attr('class', 'station-container');

        this.station = station;
    }

    update(data) {
        if (this.data === data) return;
        this.data = data;
        const { station } = this;
        const haveIssues = (data.RecordsStatus > 0 || data.UpdateStatus > HOURS_ACCEPTABLE_GAP);

        station.selectAll('.station-icon')
            .data([data])
            .enter()
            .append('g')
            .attr("class", 'station-icon')
            .append('circle')
            .attr('class', 'station-background')
            .on('mouseover', (d,i)=>this.onOver(d,i))
            .on('mouseout', (d,i)=>this.onOut(d,i))

        const pieChart = station.selectAll('.station-icon').data([data]);
        pieChart.select('.station-background')
            .attr('r', () => haveIssues ? 10 : 5)
            .attr('fill', haveIssues ? COLOR_ISSUE : COLOR_NORMAL)
            .attr('stroke', '#446380')
            .attr('stroke-width', 2);
    }

    setPosition(x,y) {
        const { station } = this;
        station
            .attr('transform', `translate(${x},${y})`);
    }

    transform(translate) {
        const { station } = this;
        station.attr('transform', translate);
    }

    dispose() {
        this.station.remove();
    }
}