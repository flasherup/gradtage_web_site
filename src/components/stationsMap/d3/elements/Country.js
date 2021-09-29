import * as d3 from "d3";

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

        const pie = d3.pie()

        const arc = d3.arc()
            .innerRadius((radius-2)/2)
            .outerRadius(radius-2);

        this.country = country;
        this.pie = pie;
        this.arc = arc;
        this.radius = radius;
    }

    update(data) {
        const { country, pie, arc } = this;
        country.selectAll('.country-pie')
            .data([data])
            .enter()
            .append('g')
            .attr("class", 'country-pie')
            .on('mouseover', (d,i)=>this.onOver(d,i))
            .on('mouseout', (d,i)=>this.onOut(d,i))
            .append('circle')
            .attr('class', 'country-background');


        const pieChart = country.selectAll('.country-pie').data([data]);

        const haveIssues = data.Raw.Updates.Issues > 0

        pieChart.select('.country-background')
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
                        .attr("d", arc);
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