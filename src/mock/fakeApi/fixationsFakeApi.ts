import { mock } from '../MockAdapter'
import { fixationsData } from '../data/fixationsData'

/** Список фиксаций для совместимости; UI ходит через локальный store в FixationsService */
mock.onGet(`/fixations`).reply(() => {
    return [
        200,
        {
            list: fixationsData,
            total: fixationsData.length,
        },
    ]
})
