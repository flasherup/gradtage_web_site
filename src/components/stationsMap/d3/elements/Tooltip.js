
import './css/tooltip.css'

export const TYPE_COUNTRY = 'country';
export const TYPE_STATION = 'station';

export default class Tooltip {
    constructor(parent, width, height) {
        this.parent = parent;
        this.width = width;
        this.height = height;
        this.initialize();
    }

    initialize() {
        const { parent, width, height } = this;
        const tooltip = parent
            .append('g')
            .attr('class', 'tooltip-container');

        tooltip
            .append('rect')
            .attr('class', 'tooltip-background')
            .attr('width', width)
            .attr('height', height)

        this.tooltip = tooltip;
    }

    update(data, type) {
        if (type === TYPE_COUNTRY) {
            this.updateTitle(data.Name);
            const items = [
                createItemData('Stations:', data.Metrics.length),
                createItemData('Update Issues:', data.Updates.Issues),
                createItemData('Records Issues:', data.Records.Issues),
            ]
            this.updateItems(items, 0, 50);
            return;
        }

        if (type === TYPE_STATION) {
            this.updateTitle(data.Name);
            const items = [
                createItemData('Country:', data.Country),
                createItemData('Last Update:', data.LastUpdate.toDateString()),
                createItemData('Record Gaps:', data.RecordsStatus),
            ]
            this.updateItems(items, 0, 50)
            return;
        }
    }

    updateTitle(title) {
        const { tooltip } = this;

        let t = tooltip
            .selectAll('.tooltip-title')
            .data([title]);

        t
            .enter()
            .append('text')
            .attr('class', 'tooltip-title');

        t
            .exit()
            .remove();

        t = tooltip
            .selectAll('.tooltip-title')
            .data([title]);

        t
            .attr('x', 10)
            .attr('y', 25)
            .text(d=>d)
    }

    updateItems(data, startX, startY) {
        const { tooltip } = this;

        let i = tooltip
            .selectAll('.tooltip-item')
            .data(data);

        const newItems = i
            .enter()
            .append('g')
            .attr('class', 'tooltip-item');

        newItems
            .append('text')
            .attr('class', 'tooltip-item-title');

        newItems
            .append('text')
            .attr('class', 'tooltip-item-value');

        i
            .exit()
            .remove();

        i = tooltip
            .selectAll('.tooltip-item')
            .data(data);

        i
            .attr('transform', (_,i)=>`translate(${startX + 10},${startY + i * 25})`);

        //update title
        const titles = i
            .select('.tooltip-item-title')
            .attr('transform', `translate(${0},${0})`)
            .text(d=>d.title);

        const titlesWidth = getTitlesWidth(titles);


        //update value
        i
            .select('.tooltip-item-value')
            .attr('transform', `translate(${titlesWidth + 10},${0})`)
            .text(d=>d.value);
    }

    setPosition(x,y) {
        const { tooltip } = this;
        tooltip
            .attr('transform', `translate(${x},${y})`);
    }

}

const createItemData = (title, value) => {
    return {title, value}
}

const getTitlesWidth = titles => {
    if (!titles || titles.empty()) return 0;
    let width = 0;
    titles.each((d,i,nodes)=> {
        const node = nodes[i];
        let bbox = node.getBBox();
        if (bbox.width > width) width = bbox.width;
    })
    return width
}