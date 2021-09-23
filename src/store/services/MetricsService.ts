// Need to use the React-specific entry point to import createApi
import {isFulfilled, Middleware} from '@reduxjs/toolkit';
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'
import {KEY_DATA_SERVER, URL_DATA_SERVER} from "../../constants";
import { preCalculate } from '../slices/MetricsSlice';
import {SerializeQueryArgs} from "@reduxjs/toolkit/dist/query/defaultSerializeQueryArgs";

export interface Metric {
    Name: string
    Country: string
    StationId: string
    Latitude: number
    Longitude: number
    LastUpdate: string
    FirstUpdate: string
    RecordsAll: number
    RecordsClean: number
}

export interface Metrics {
    status: string
    error: string
    response: Metric[]
}

// Define a service using a base URL and expected endpoints
const metricsAPI = createApi({
    reducerPath: 'metricsAPI',
    baseQuery: fetchBaseQuery({baseUrl: `${URL_DATA_SERVER}/`}),
    endpoints: (builder) => ({
        getMetrics: builder.query<Metrics, string>({
            query: () => `service/metrics/?key=${KEY_DATA_SERVER}&use=internal`,
        }),
    }),
})

export const metricsDataProcessMiddleware: Middleware = (
    {dispatch}) => (next) => (action) => {
    if (isFulfilled(action)) {
        if (action.type.search(metricsAPI.reducerPath) >= 0) {
            const metrics = action.payload as Metrics;
            dispatch(preCalculate(metrics.response));
        }
    }
    return next(action);
};

export default metricsAPI

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useGetMetricsQuery} = metricsAPI