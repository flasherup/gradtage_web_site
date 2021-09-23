import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../MainStore'
import {Metric} from "../services/MetricsService";
import {CUT_DATE_WBH, DAY_MILLISECONDS, HOUR_MILLISECONDS} from "../../constants";


interface AdvancedMetric{
    Name: string,
    Country: string,
    StationId: string,
    Latitude: number,
    Longitude: number,
    LastUpdate: Date,
    FirstUpdate: Date,
    RecordsAll: number,
    RecordsClean: number,
    UpdateStatus: number
    RecordsStatus: number
}


interface MetricsCountry {
    name: string
    metrics:  AdvancedMetric[]
}

export interface MetricsState {
    countries: Map<string, MetricsCountry>
    all: AdvancedMetric[]
}

// Define the initial state using that type
const initialState: MetricsState = {
    countries: new Map<string, MetricsCountry>(),
    all: []
}

export const metricsSlice = createSlice({
    name: 'metrics',
    initialState,
    reducers: {
        preCalculate: (state, action: PayloadAction<Metric[]>) => {
            state.all = preCalculateMetrics(action.payload)
            state.countries = sortByCountry(state.all);
        },
    },
})


const preCalculateMetrics = (metrics: Metric[]):AdvancedMetric[]  => {
    //const res:AdvancedMetric[] = new Array(metrics.length);
    const now:Date = new Date();
    const yesterday:Date = new Date();
    yesterday.setDate(now.getDate()-1);
    const standard:number = getStoredHours(yesterday)
    return metrics.map(metric => {
        const am = metricToAdvanceMetric(metric)
        am.UpdateStatus = calculateUpdateStatus(now, am.LastUpdate)
        am.RecordsStatus = calculateRecordsStatus(standard, am.RecordsClean)
        return am
    });
}

const sortByCountry = (metrics: AdvancedMetric[]):Map<string, MetricsCountry>  => {
    const res: Map<string, MetricsCountry> = new Map<string, MetricsCountry>()
    //Sort By countries
    let metricsCountry: MetricsCountry;
    metrics.forEach((metric: AdvancedMetric) => {
        if (!res.hasOwnProperty(metric.Country)) {
            metricsCountry = {} as MetricsCountry;
            metricsCountry.name = metric.Country;
            metricsCountry.metrics = [];
            res.set(metric.Country, metricsCountry)
        } else {
            metricsCountry = res.get(metric.Country) as MetricsCountry
        }
        metricsCountry.metrics.push(metric)
    })
    return res;
}

const metricToAdvanceMetric = (metric: Metric):AdvancedMetric => {
    return {
        Name: metric.Name,
        Country: metric.Country,
        StationId: metric.StationId,
        Latitude: metric.Latitude,
        Longitude: metric.Longitude,
        LastUpdate: new Date(metric.LastUpdate),
        FirstUpdate: new Date(metric.FirstUpdate),
        RecordsAll: metric.RecordsAll,
        RecordsClean: metric.RecordsClean,
        UpdateStatus: 0,
        RecordsStatus: 0,
    } as AdvancedMetric
}

const calculateUpdateStatus = (now:Date, update:Date):number => {
    const days = Math.round((now.getTime() - update.getTime())/DAY_MILLISECONDS);
    if (days > 20) return 20;
    return days
}

const calculateRecordsStatus = (standard:number, records:number):number => {
    const gaps:number = standard - records;
    //console.log("standard", standard, 'records', records)
    if (gaps > 20) return 20;
    return gaps
}

const getStoredHours = (time:Date):number => {
    const start = new Date(CUT_DATE_WBH)
    const delta = Math.abs( time.getTime() - start.getTime());
    return  Math.floor(delta / (HOUR_MILLISECONDS));


}

export const { preCalculate } = metricsSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const selectCount = (state: RootState) => state.metrics.countries

export default metricsSlice.reducer