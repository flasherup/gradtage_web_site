import * as d3 from "d3";
import {HOURS_ACCEPTABLE_GAP} from "../../../../constants";
import StationImage from '../../../../images/Station.svg';
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

        const pie = d3.pie().value((d)=>d.value);

        const arc = d3.arc()
            .innerRadius(9)
            .outerRadius(12);

        this.pie = pie;
        this.arc = arc;

        this.station = station;
    }

    update(data) {
        if (this.data === data) return;
        this.data = data;
        const { station, pie, arc } = this;
        const haveIssues = (data.RecordsStatus > 0 || data.UpdateStatus > HOURS_ACCEPTABLE_GAP);

        const newStationIcon = station.selectAll('.station-icon')
            .data([data])
            .enter()
            .append('g')
            .attr("class", 'station-icon')
            .on('mouseover', (d,i)=>this.onOver(d,i))
            .on('mouseout', (d,i)=>this.onOut(d,i));

        newStationIcon
            .append('circle')
            .attr('class', 'station-background');

        newStationIcon
            .append('svg:image')
            .attr('class', 'station-flag')
            .attr('transform', 'translate(-7.5,-7.5)')

        const pieChart = station.selectAll('.station-icon').data([data]);
        pieChart.select('.station-background')
            .attr('r', 13)
            .attr('fill', '#FFFFFF')

        pieChart.select('.station-flag')
            .attr("xlink:href", `${process.env.PUBLIC_URL}/flags_circle_r15px/${data.CountryCode}.png`);

        const pieData = pie([
            {
                value: 1,
                color: data.RecordsStatus>0?COLOR_ISSUE:COLOR_NORMAL
            },
            {
                value: 1,
                color: data.UpdateStatus>0?COLOR_ISSUE:COLOR_NORMAL
            }
        ]);

        pieChart.selectAll('.arc')
            .data(pieData)
            .join(
                enter => {
                    enter
                        .append("path")
                        .attr("class", "arc")
                        .attr("fill", d=>d.data.color)
                        .attr("d", arc);
                },
                update => {
                    update
                        .attr("fill", d=>d.data.color)
                        .attr("d", arc)
                },
                exit => {
                    exit
                        .remove();
                }
            )
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