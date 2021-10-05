import { configureStore } from '@reduxjs/toolkit'
// Or from '@reduxjs/toolkit/query/react'
import { setupListeners } from '@reduxjs/toolkit/query'
import metricsAPI, {metricsDataProcessMiddleware} from './services/MetricsService'
import MetricsSlice from './slices/MetricsSlice'
import flagsAPI from "./services/FlagService";

export const MainStore = configureStore({
    reducer: {
        [metricsAPI.reducerPath]: metricsAPI.reducer,
        [flagsAPI.reducerPath]: flagsAPI.reducer,
        metrics: MetricsSlice,
    },

    middleware:(getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        })
            .concat(metricsAPI.middleware)
            .concat(flagsAPI.middleware)
            .concat(metricsDataProcessMiddleware),
})

setupListeners(MainStore.dispatch)

export type RootState = ReturnType<typeof MainStore.getState>
export type AppDispatch = typeof MainStore.dispatch