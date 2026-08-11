import type { ObjectsSearchFilters } from './types'

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
    'complexIds',
]

export const createEmptyObjectsSearchFilters = (
    complexId = '',
): ObjectsSearchFilters => ({
    type: [],
    complexIds: [],
    complexId,
    rooms: [],
    priceFrom: '',
    priceTo: '',
    areaFrom: '',
    areaTo: '',
    floorFrom: '',
    floorTo: '',
})

export const parseObjectsSearchFilters = (
    search: string,
    fallbackComplexId = '',
): ObjectsSearchFilters => {
    const params = new URLSearchParams(search)
    const filters = createEmptyObjectsSearchFilters(fallbackComplexId)

    Object.keys(filters).forEach((key) => {
        const typedKey = key as keyof ObjectsSearchFilters
        const rawValue = params.get(key)

        if (!rawValue) return

        if (arrayKeys.includes(typedKey)) {
            const values = rawValue.split(',').filter(Boolean)

            if (typedKey === 'type') {
                filters.type = values as ObjectsSearchFilters['type']
            }

            if (typedKey === 'rooms') {
                filters.rooms = values
                    .map((value) => Number(value))
                    .filter((value) => Number.isFinite(value))
            }

            if (typedKey === 'complexIds') {
                filters.complexIds = values
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

    const legacyComplexId = params.get('complexId')
    if (
        legacyComplexId &&
        (!filters.complexIds || filters.complexIds.length === 0) &&
        !fallbackComplexId
    ) {
        filters.complexIds = [legacyComplexId]
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
        if (value === '' || value === undefined || value === null) return
        if (Array.isArray(value)) {
            if (value.length === 0) return
            params.set(key, value.join(','))
            return
        }
        params.set(key, String(value))
    })

    return params
}
