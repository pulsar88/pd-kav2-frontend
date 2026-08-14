/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from '../MockAdapter'
import { searchQueryPoolData } from '../data/commonData'
import wildCardSearch from '@/utils/wildCardSearch'

mock.onGet(`/api/search/query`).reply((config) => {
    const { query } = config.params

    const result = wildCardSearch(searchQueryPoolData, query, 'title')

    const categories: (string | number)[] = []

    result.forEach((elm) => {
        if (!categories.includes(elm.categoryTitle)) {
            categories.push(elm.categoryTitle)
        }
    })

    const data = categories.map((category) => {
        return {
            title: category,
            data: result
                .filter((elm) => elm.categoryTitle === category)
                .filter((_, index) => index < 5),
        }
    })

    return [200, data]
})
