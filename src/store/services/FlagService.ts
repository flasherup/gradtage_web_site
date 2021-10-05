import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

interface Flag {
    country: string
    flag_base64: string
}

const flagsAPI = createApi({
    reducerPath: 'flagsAPI',
    baseQuery: fetchBaseQuery({baseUrl: `${process.env.PUBLIC_URL}/`}),
    endpoints: (builder) => ({
        getFlags: builder.query<Map<string, Flag>, string>({
            query: () => `country-by-flag.json`,
            transformResponse: (response: Flag[]) => {
                const res = new Map<string, Flag>();
                response.forEach(flag=> {
                    res.set(flag.country, flag)
                })
                return res;
            },
        }),
    }),
})

export default flagsAPI
export const {useGetFlagsQuery} = flagsAPI