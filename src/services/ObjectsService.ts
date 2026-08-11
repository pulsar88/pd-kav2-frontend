import { checkboardByComplexId } from '@/mock/data/checkboardData'
import type {
    Complex,
    Premise,
    ObjectsSearchFilters,
} from '@/views/objects/types'
import type { CheckboardBuilding } from '@/views/objects/checkboard.types'
import {
    buildCatalogComplexes,
    buildCatalogPremises,
    filterCatalogPremises,
} from '@/views/objects/catalogUtils'

const delay = (ms = 200) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms)
    })

let catalogPremisesCache: Premise[] | null = null

const getCatalogPremises = () => {
    if (!catalogPremisesCache) {
        catalogPremisesCache = buildCatalogPremises()
    }
    return catalogPremisesCache
}

export async function apiGetComplexes(): Promise<Complex[]> {
    await delay()
    return buildCatalogComplexes()
}

export async function apiGetCheckboard(
    complexId: string,
): Promise<CheckboardBuilding | null> {
    await delay(200)
    return checkboardByComplexId[complexId] || checkboardByComplexId.jk1 || null
}

export async function apiSearchPremises(
    filters: ObjectsSearchFilters,
): Promise<Premise[]> {
    await delay(250)
    return filterCatalogPremises(getCatalogPremises(), filters)
}
