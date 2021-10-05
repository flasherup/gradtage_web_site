import * as d3 from "d3";
import './css/country.css'

const COLOR_NORMAL = '#31C52E';
const COLOR_ISSUE = '#C5402E';

export default class Country {
    constructor(parent, width, height, onOver, onOut) {
        this.parent = parent;
        this.width = width;
        this.height = height;
        this.onOver = onOver;
        this.onOut = onOut;
        this.initialize();
    }

    initialize() {
        const { parent, width, height } = this;
        const radius = Math.min(width, height);
        const country = parent
            .append('g')
            .attr('class', 'country-container');

        const pie = d3.pie().value((d)=>d.value);

        const arc = d3.arc()
            .innerRadius(15)
            .outerRadius(20);

        this.pie = pie;
        this.arc = arc;
        this.country = country;
        this.radius = radius;
    }

    update(data) {
        const { country, pie, arc } = this;
        const newCountry = country.selectAll('.country-pie')
            .data([data])
            .enter()
            .append('g')
            .attr("class", 'country-pie')
            .on('mouseover', (d,i)=>this.onOver(d,i))
            .on('mouseout', (d,i)=>this.onOut(d,i));

        newCountry
            .append('circle')
            .attr('class', 'country-background');

        newCountry
            .append('svg:image')
            .attr('class', 'country-flag')
            .attr('height', 25)
            .attr('transform', 'translate(-12.5,-12.5)')
            //.attr("mask", "url(#countryMask)")


        const pieChart = country.selectAll('.country-pie').data([data]);
        pieChart.select('.country-background')
            .attr('r', 22)
            //.attr('fill', haveIssues ? COLOR_ISSUE : COLOR_NORMAL)
            .attr('fill', '#FFFFFF')

        const pieData = pie([
            {
                value: 1,
                color: data.Records.Issues>0?COLOR_ISSUE:COLOR_NORMAL
            },
            {
                value: 1,
                color: data.Updates.Issues>0?COLOR_ISSUE:COLOR_NORMAL
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


        pieChart.select('.country-flag')
            .attr("xlink:href", `${process.env.PUBLIC_URL}/flags_circle_r25px/${data.Code}.png`);
    }

    setPosition(x,y) {
        const { country } = this;
        country
            .attr('transform', `translate(${x},${y})`);
    }

    transform(translate) {
        const { country } = this;
        country.attr('transform', translate);
    }

    dispose() {
        this.country.remove();
    }
}