import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../MainStore'
import {Metric} from "../services/MetricsService";
import {CUT_DATE_WBH, DAY_MILLISECONDS, HOUR_MILLISECONDS, HOURS_THRESHOLD} from "../../constants";


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

interface Status {
    Normals: number
    Issues: number
}

interface MetricsCountry {
    Name: string
    Records: Status
    Updates: Status
    Metrics:  AdvancedMetric[]
}

export interface MetricsState {
    Countries: Map<string, MetricsCountry>
    All: AdvancedMetric[]
}

// Define the initial state using that type
const initialState: MetricsState = {
    Countries: new Map<string, MetricsCountry>(),
    All: []
}

export const metricsSlice = createSlice({
    name: 'metrics',
    initialState,
    reducers: {
        preCalculate: (state, action: PayloadAction<Metric[]>) => {
            state.All = preCalculateMetrics(action.payload)
            const sorted = sortByCountry(state.All);
            state.Countries = calculateCountryStatus(sorted);
        },
    },
})


const preCalculateMetrics = (metrics: Metric[]):AdvancedMetric[]  => {
    //const res:AdvancedMetric[] = new Array(metrics.length);
    const now:Date = new Date();
    now.setDate(now.getDate()-1)
    return metrics.map(metric => {
        const am = metricToAdvanceMetric(metric)
        am.UpdateStatus = calculateUpdateStatus(now, am.LastUpdate);
        am.RecordsStatus = calculateRecordsStatus(am.LastUpdate, am.RecordsClean);
        return am
    });
}

const sortByCountry = (metrics: AdvancedMetric[]):Map<string, MetricsCountry>  => {
    const res: Map<string, MetricsCountry> = new Map<string, MetricsCountry>()
    //Sort By countries
    let metricsCountry: MetricsCountry;
    metrics.forEach((metric: AdvancedMetric) => {
        if (!res.has(metric.Country)) {
            metricsCountry = {} as MetricsCountry;
            metricsCountry.Name = metric.Country;
            metricsCountry.Metrics = [];
            metricsCountry.Records = {Normals:0, Issues:0} as Status;
            metricsCountry.Updates = {Normals:0, Issues:0} as Status;
            res.set(metric.Country, metricsCountry)
        } else {
            metricsCountry = res.get(metric.Country) as MetricsCountry
        }
        metricsCountry.Metrics.push(metric)
    })
    console.log('metricsCountry', res)
    return res;
}

const calculateCountryStatus = (countries: Map<string, MetricsCountry>):Map<string, MetricsCountry> => {
    countries.forEach((country) => {
        country.Metrics.forEach(metric => {
            const { RecordsStatus, UpdateStatus } = metric;
            if (RecordsStatus === 0) {
                country.Records.Normals++
            } else {
                country.Records.Issues++
            }

            if (UpdateStatus === 0) {
                country.Updates.Normals++
            } else {
                country.Updates.Issues++
            }
        })
    })
    return countries;
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
    const hours = Math.round((now.getTime() - update.getTime())/HOUR_MILLISECONDS);
    if (hours < 0) return 1;
    if (hours > HOURS_THRESHOLD) return HOURS_THRESHOLD;
    return hours;
}

const calculateRecordsStatus = (date:Date, records:number):number => {
    const standard = getStoredHours(date)
    const gaps:number = standard - records;
    //console.log("standard", standard, 'records', records)
    if (gaps > HOURS_THRESHOLD) return HOURS_THRESHOLD;
    return gaps
}

const getStoredHours = (date:Date):number => {
    const start = new Date(CUT_DATE_WBH)
    const delta = Math.abs( date.getTime() - start.getTime());
    return  Math.floor(delta / (HOUR_MILLISECONDS));


}

export const { preCalculate } = metricsSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const selectCount = (state: RootState) => state.metrics.Countries

export default metricsSlice.reducer