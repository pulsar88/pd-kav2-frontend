import type { ObjectsSearchFilters } from './types'
import { isRealtyPropertyTypeCode } from './realtyPropertyQuery'

export type ObjectsCatalogTab = 'complexes' | 'premises'

const CATALOG_TAB_PARAM = 'tab'
const SPECIAL_OFFER_ID_PARAM = 'special_offer_id'

const numberKeys: Array<keyof ObjectsSearchFilters> = [
    'priceFrom',
    'priceTo',
    'areaFrom',
    'areaTo',
    'floorFrom',
    'floorTo',
]

const arrayKeys: Array<keyof ObjectsSearchFilters> = [
    'type',
    'rooms',
    'realtyProjectIds',
    'specialOfferIds',
]

export const createEmptyObjectsSearchFilters = (
    complexId = '',
): ObjectsSearchFilters => ({
    type: [],
    realtyProjectIds: [],
    complexId,
    rooms: [],
    priceFrom: '',
    priceTo: '',
    areaFrom: '',
    areaTo: '',
    floorFrom: '',
    floorTo: '',
    fromInvestor: '',
    specialOfferId: '',
    specialOfferIds: [],
})

export const withoutComplexFilters = (
    filters: ObjectsSearchFilters,
): ObjectsSearchFilters => ({
    ...filters,
    realtyProjectIds: [],
    complexId: '',
})

export const parseObjectsSearchFilters = (
    search: string,
    fallbackComplexId = '',
): ObjectsSearchFilters => {
    const params = new URLSearchParams(search)
    const filters = createEmptyObjectsSearchFilters(fallbackComplexId)

    Object.keys(filters).forEach((key) => {
        const typedKey = key as keyof ObjectsSearchFilters

        if (typedKey === 'specialOfferId') {
            return
        }

        if (typedKey === 'fromInvestor') {
            const rawValue = params.get('fromInvestor')
            if (rawValue === '1' || rawValue === '0') {
                filters.fromInvestor = rawValue
            }
            return
        }

        const rawValue = params.get(key)

        if (!rawValue) return

        if (arrayKeys.includes(typedKey)) {
            const values = rawValue.split(',').filter(Boolean)

            if (typedKey === 'type') {
                filters.type = values
                    .map((value) =>
                        value.toLowerCase() === 'apartments'
                            ? 'apartment'
                            : value,
                    )
                    .filter(isRealtyPropertyTypeCode)
            }

            if (typedKey === 'rooms') {
                filters.rooms = values
            }

            if (typedKey === 'realtyProjectIds') {
                filters.realtyProjectIds = values
            }

            if (typedKey === 'specialOfferIds') {
                filters.specialOfferIds = values
            }

            return
        }

        if (numberKeys.includes(typedKey)) {
            const parsed = Number(rawValue)
            if (Number.isFinite(parsed)) {
                ;(filters[typedKey] as number | '') = parsed
            }
            return
        }

        ;(filters[typedKey] as string) = rawValue
    })

    const specialOfferId = params.get(SPECIAL_OFFER_ID_PARAM)
    if (specialOfferId) {
        filters.specialOfferId = specialOfferId
    }

    const legacyComplexId = params.get('complexId')
    if (
        legacyComplexId &&
        (!filters.realtyProjectIds || filters.realtyProjectIds.length === 0) &&
        !fallbackComplexId
    ) {
        filters.realtyProjectIds = [legacyComplexId]
    }

    return filters
}

export const serializeObjectsSearchFilters = (
    filters: ObjectsSearchFilters,
    overrides?: Partial<ObjectsSearchFilters>,
) => {
    const params = new URLSearchParams()
    const nextFilters = { ...filters, ...overrides }

    Object.entries(nextFilters).forEach(([key, value]) => {
        if (key === 'specialOfferId') return
        if (value === '' || value === undefined || value === null) return
        if (typeof value === 'boolean') {
            if (value) {
                params.set(key, '1')
            }
            return
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return
            params.set(key, value.join(','))
            return
        }
        params.set(key, String(value))
    })

    if (nextFilters.specialOfferId) {
        params.set(SPECIAL_OFFER_ID_PARAM, nextFilters.specialOfferId)
    }

    return params
}

export const hasActiveObjectsSearchFilters = (
    filters: ObjectsSearchFilters,
) => {
    const params = serializeObjectsSearchFilters(filters)
    return params.toString().length > 0
}

export const parseObjectsCatalogTab = (search: string): ObjectsCatalogTab =>
    new URLSearchParams(search).get(CATALOG_TAB_PARAM) === 'premises'
        ? 'premises'
        : 'complexes'

export const appendObjectsCatalogTab = (
    params: URLSearchParams,
    tab: ObjectsCatalogTab,
) => {
    if (tab === 'premises') {
        params.set(CATALOG_TAB_PARAM, 'premises')
    } else {
        params.delete(CATALOG_TAB_PARAM)
    }

    return params
}

export const preserveObjectsCatalogTab = (
    params: URLSearchParams,
    search: string,
) => appendObjectsCatalogTab(params, parseObjectsCatalogTab(search))
