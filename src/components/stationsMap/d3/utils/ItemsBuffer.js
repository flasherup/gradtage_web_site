export default class ItemsBuffer {
    constructor(fabric) {
        this.itemsFabric = fabric;
        this.buffer = new Map();
    }

    update(data, keyAccessor) {
        const { buffer, itemsFabric } = this;
        const {thresh, newbies} = getNewAndThresh(data, buffer, keyAccessor);
        thresh.forEach((item, key)=> {
            buffer.delete(key);
            if (newbies.length > 0) {
                const newbie = newbies.pop();
                buffer.set(newbie[keyAccessor], item);
                thresh.delete(key);
            }
        })
        newbies.forEach(newbie => {
            buffer.set(newbie[keyAccessor], itemsFabric());
        })
        return {buffer, thresh};
    }

    clean() {
        const thresh = this.buffer;
        this.buffer = new Map();
        return thresh;
    }
}

const getNewAndThresh = (data, buffer, accessor) => {
    const  newbies = [];
    const thresh = new Map(buffer);
    data.forEach(item=>{
        if (thresh.has(item[accessor])) {
            thresh.delete(item[accessor]);
        } else {
            newbies.push(item)
        }
    });
    return {thresh,newbies};
}