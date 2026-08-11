import { complexesData, DEFAULT_LAYOUT_IMAGE } from '@/mock/data/premisesData'
import { checkboardByComplexId } from '@/mock/data/checkboardData'
import type { FlatCheckboardProperty } from './checkboard.types'
import {
    flattenBuildingProperties,
    getPricePerSqm,
} from './checkboardUtils'
import type {
    Complex,
    ObjectsSearchFilters,
    Premise,
    PremiseType,
} from './types'

const mapTypeCodeToPremiseType = (code: string): PremiseType => {
    if (code === 'property') return 'apartment'
    if (code === 'apartments') return 'apartments'
    return 'commercial'
}

const getBuildingMaxFloor = (complex: Complex) => {
    const building = checkboardByComplexId[complex.id]
    if (!building) return complex.floors

    const sectionMax = building.sections.reduce(
        (max, section) => Math.max(max, section.checkboard_data.max_floor),
        0,
    )

    return Math.max(sectionMax, complex.floors)
}

const mapPropertyToPremise = (
    property: FlatCheckboardProperty,
    complex: Complex,
    floorsInBuilding: number,
): Premise => ({
    id: `${complex.id}-${property.id}`,
    checkboardPropertyId: property.id,
    complexId: complex.id,
    complexName: complex.name,
    address: complex.address,
    number: property.number,
    type: mapTypeCodeToPremiseType(property.type.code),
    rooms: property.studio ? 0 : property.rooms_count,
    area: property.area,
    floor: property.floor,
    floorsInBuilding,
    price: property.price,
    pricePerSqm: property.pricePerSqm,
    houseType: complex.houseType,
    finishing: complex.finishing,
    houseStatus: complex.houseStatus,
    deliveryDate: complex.completionDate,
    layout: property.sectionName,
    layoutImage: DEFAULT_LAYOUT_IMAGE,
})

export const buildCatalogPremises = (): Premise[] =>
    complexesData.flatMap((complex) => {
        const building = checkboardByComplexId[complex.id]
        if (!building) return []

        const floorsInBuilding = getBuildingMaxFloor(complex)

        return flattenBuildingProperties(building).map((property) =>
            mapPropertyToPremise(property, complex, floorsInBuilding),
        )
    })

export const buildCatalogComplexes = (): Complex[] =>
    complexesData.map((complex) => {
        const building = checkboardByComplexId[complex.id]
        if (!building) return complex

        const properties = flattenBuildingProperties(building)
        const prices = properties
            .map((item) => item.price)
            .filter((price) => price > 0)
        const pricesPerSqm = properties
            .map((item) => item.pricePerSqm)
            .filter((price) => price > 0)

        return {
            ...complex,
            apartmentsCount: properties.length,
            priceFrom: prices.length ? Math.min(...prices) : complex.priceFrom,
            pricePerSqm: pricesPerSqm.length
                ? Math.min(...pricesPerSqm)
                : complex.pricePerSqm,
        }
    })

const toNumber = (value: number | '' | undefined) => {
    if (value === '' || value === undefined || value === null) return undefined
    return Number(value)
}

export const filterCatalogPremises = (
    list: Premise[],
    filters: ObjectsSearchFilters,
): Premise[] => {
    const priceFrom = toNumber(filters.priceFrom)
    const priceTo = toNumber(filters.priceTo)
    const areaFrom = toNumber(filters.areaFrom)
    const areaTo = toNumber(filters.areaTo)
    const floorFrom = toNumber(filters.floorFrom)
    const floorTo = toNumber(filters.floorTo)
    const rooms = (filters.rooms || []).map(Number).filter(Number.isFinite)
    const selectedTypes = filters.type || []
    const complexIds = filters.complexIds || []

    return list.filter((item) => {
        if (selectedTypes.length > 0 && !selectedTypes.includes(item.type)) {
            return false
        }
        if (complexIds.length > 0 && !complexIds.includes(item.complexId)) {
            return false
        }
        if (filters.complexId && item.complexId !== filters.complexId)
            return false
        if (rooms.length > 0) {
            const roomMatched = rooms.some((room) => {
                if (room >= 4) {
                    return item.rooms >= 4
                }
                return item.rooms === room
            })

            if (!roomMatched) {
                return false
            }
        }
        if (priceFrom !== undefined && item.price < priceFrom) return false
        if (priceTo !== undefined && item.price > priceTo) return false
        if (areaFrom !== undefined && item.area < areaFrom) return false
        if (areaTo !== undefined && item.area > areaTo) return false
        if (floorFrom !== undefined && item.floor < floorFrom) return false
        if (floorTo !== undefined && item.floor > floorTo) return false
        return true
    })
}
