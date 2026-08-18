import type { ObjectsSearchFilters, RealtyPropertyTypeCode } from './types'

const toQueryNumber = (value: number | '' | undefined) => {
    if (value === '' || value === undefined || value === null) {
        return undefined
    }

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : undefined
}

const REALTY_PROPERTY_TYPE_CODES = new Set<RealtyPropertyTypeCode>([
    'property',
    'apartment',
    'parking',
    'office',
    'pantry',
    'free_destination',
])

export const isRealtyPropertyTypeCode = (
    value: string,
): value is RealtyPropertyTypeCode =>
    REALTY_PROPERTY_TYPE_CODES.has(value as RealtyPropertyTypeCode)

export const normalizeRealtyPropertyTypeCode = (
    code: string,
): RealtyPropertyTypeCode | null => {
    const normalized = code.toLowerCase()

    if (normalized === 'apartments') {
        return 'apartment'
    }

    return isRealtyPropertyTypeCode(normalized) ? normalized : null
}

export type ApiFilterParamsValue = string | number | Array<string | number>

export type ApiFilterParams = Record<string, ApiFilterParamsValue>

export type RealtyRoomMatchProperty = {
    studio?: boolean
    euro?: boolean
    rooms_count: number
    type?: { has_rooms?: boolean; has_layout_type?: boolean }
}

export const matchesRealtyRoomFilters = (
    property: RealtyRoomMatchProperty,
    filterValues: string[],
): boolean => {
    if (!filterValues.length) {
        return true
    }

    return filterValues.some((filter) => {
        switch (filter) {
            case 'studio':
                return Boolean(property.studio)
            case 'free_layout':
                return Boolean(
                    property.type?.has_layout_type &&
                        !property.studio &&
                        property.rooms_count === 0,
                )
            case '4':
                return property.rooms_count >= 4 && !property.studio
            default:
                if (filter.endsWith('c')) {
                    const count = Number(filter.slice(0, -1))
                    return (
                        Boolean(property.euro) &&
                        !property.studio &&
                        property.rooms_count === count
                    )
                }

                {
                    const count = Number(filter)
                    if (!Number.isFinite(count)) {
                        return false
                    }

                    return (
                        !property.euro &&
                        !property.studio &&
                        property.rooms_count === count
                    )
                }
        }
    })
}

export const toAxiosParams = (params: ApiFilterParams) => {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item) => searchParams.append(key, String(item)))
            return
        }

        searchParams.set(key, String(value))
    })

    return searchParams
}

export const mapObjectsSearchFiltersToApiParams = (
    filters: ObjectsSearchFilters,
): ApiFilterParams => {
    const params: ApiFilterParams = {}

    const floorFrom = toQueryNumber(filters.floorFrom)
    const floorTo = toQueryNumber(filters.floorTo)
    const areaFrom = toQueryNumber(filters.areaFrom)
    const areaTo = toQueryNumber(filters.areaTo)
    const priceFrom = toQueryNumber(filters.priceFrom)
    const priceTo = toQueryNumber(filters.priceTo)

    if (floorFrom !== undefined) {
        params.floor_from = floorFrom
    }

    if (floorTo !== undefined) {
        params.floor_to = floorTo
    }

    if (areaFrom !== undefined) {
        params.area_from = areaFrom
    }

    if (areaTo !== undefined) {
        params.area_to = areaTo
    }

    if (priceFrom !== undefined) {
        params.price_from = priceFrom
    }

    if (priceTo !== undefined) {
        params.price_to = priceTo
    }

    if (filters.type?.length) {
        params['type[]'] = filters.type
    }

    if (filters.rooms?.length) {
        params['rooms[]'] = filters.rooms
    }

    if (filters.realtyProjectIds?.length) {
        params['realty_project_id[]'] = filters.realtyProjectIds.map(Number)
    }

    return params
}
