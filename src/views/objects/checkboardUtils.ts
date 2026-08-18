import type {
    CheckboardBuilding,
    CheckboardCellLabel,
    CheckboardFilters,
    CheckboardProperty,
    CheckboardSection,
    FlatCheckboardProperty,
    SectionColumn,
} from './checkboard.types'
import type { ObjectsSearchFilters, Premise, PremiseType, RealtyPropertyTypeCode } from './types'
import { matchesRealtyRoomFilters } from './realtyPropertyQuery'
import { normalizeRealtyPropertyTypeCode } from './realtyPropertyQuery'

const mapCheckboardTypeCodeToPremiseType = (code: string): PremiseType => {
    const normalized = code.toLowerCase()
    if (normalized === 'property' || normalized === 'apartment') {
        return 'apartment'
    }
    if (normalized === 'apartments') {
        return 'apartments'
    }
    return 'commercial'
}

export const buildPremiseFromCheckboardProperty = (
    property: FlatCheckboardProperty,
    options: {
        propertyDetails?: Premise | null
        complexId?: string
        complexName?: string
    } = {},
): Premise => {
    const { propertyDetails = null, complexId, complexName } = options
    const externalId = Number(property.external_id)
    const checkboardPropertyId = Number.isFinite(externalId)
        ? externalId
        : property.id
    const typeCode =
        propertyDetails?.typeCode ??
        (normalizeRealtyPropertyTypeCode(property.type.code) ??
            property.type.code.toLowerCase())

    return {
        id: propertyDetails?.id ?? String(property.id),
        checkboardPropertyId,
        externalId: checkboardPropertyId,
        number: propertyDetails?.number ?? property.number,
        section: propertyDetails?.section ?? property.sectionName,
        type: propertyDetails?.type ?? mapCheckboardTypeCodeToPremiseType(property.type.code),
        typeCode,
        typeName: propertyDetails?.typeName ?? property.type.name,
        rooms: propertyDetails?.rooms ?? property.rooms_count,
        area: propertyDetails?.area ?? property.area,
        goodArea: propertyDetails?.goodArea ?? property.good_area,
        floor: propertyDetails?.floor ?? property.floor,
        price:
            propertyDetails?.price ??
            (property.price > 0 ? property.price : undefined),
        pricePerSqm: propertyDetails?.pricePerSqm,
        layoutImage: propertyDetails?.layoutImage,
        layout: propertyDetails?.layout,
        complexId: propertyDetails?.complexId ?? complexId,
        complexName: propertyDetails?.complexName ?? complexName,
        address: propertyDetails?.address,
        material: propertyDetails?.material,
        facing: propertyDetails?.facing,
        buildingState: propertyDetails?.buildingState,
        houseStatus: propertyDetails?.houseStatus,
        developmentStart: propertyDetails?.developmentStart,
        deliveryDate: propertyDetails?.deliveryDate,
    }
}

export const emptyCheckboardFilters: CheckboardFilters = {
    typeCode: '',
    rooms: '',
    priceFrom: '',
    priceTo: '',
    areaFrom: '',
    areaTo: '',
    pricePerSqmFrom: '',
    pricePerSqmTo: '',
    statusCode: '',
}

export const getPricePerSqm = (price: number, area: number) =>
    area > 0 ? Math.round(price / area) : 0

export const formatCheckboardPrice = (value: number) =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(value)

export const formatTypeShortLabel = (property: CheckboardProperty) => {
    const byCode: Record<string, string> = {
        parking: 'ММ',
        pantry: 'Кл',
        office: 'Оф',
        property: 'Кв',
        apartment: 'Ап',
        apartments: 'Ап',
    }
    return byCode[property.type.code] || property.type.name.slice(0, 2)
}

export const formatRoomsLabel = (property: CheckboardProperty) => {
    if (property.studio) return 'С'
    if (property.type.has_rooms && property.rooms_count > 0) {
        return String(property.rooms_count)
    }
    // типы без комнат (кладовка, парковка и т.п.) — короткое обозначение типа
    if (!property.type.has_rooms) {
        return formatTypeShortLabel(property)
    }
    return formatTypeShortLabel(property)
}

export const getCellLabel = (
    property: CheckboardProperty,
    mode: CheckboardCellLabel,
) => (mode === 'number' ? property.number : formatRoomsLabel(property))

const getSectionProperties = (
    section: CheckboardSection,
): CheckboardProperty[] => {
    if (Array.isArray(section.properties)) return section.properties
    return Object.values(section.properties).flat()
}

/** Колонки: сначала 1..max_per_floor, затем стояки по checkboard_offset */
export const getSectionColumns = (
    section: CheckboardSection,
): SectionColumn[] => {
    const maxPerFloor = section.checkboard_data.max_per_floor
    const columns: SectionColumn[] = []

    for (let offset = 1; offset <= maxPerFloor; offset += 1) {
        columns.push({
            key: `offset-${offset}`,
            kind: 'offset',
            offset,
            label: String(offset),
        })
    }

    const stacks = [...section.stacks].sort(
        (a, b) => a.checkboard_offset - b.checkboard_offset,
    )

    stacks.forEach((stack) => {
        columns.push({
            key: `stack-${stack.id}`,
            kind: 'stack',
            stackId: stack.id,
            label: stack.name,
        })
    })

    return columns
}

export const resolveColumn = (
    property: CheckboardProperty,
    section: CheckboardSection,
) => {
    const columns = getSectionColumns(section)

    if (property.stack_id != null) {
        const index = columns.findIndex(
            (column) =>
                column.kind === 'stack' && column.stackId === property.stack_id,
        )
        return index >= 0 ? index + 1 : 0
    }

    const index = columns.findIndex(
        (column) =>
            column.kind === 'offset' &&
            column.offset === property.checkboard_offset,
    )
    return index >= 0 ? index + 1 : 0
}

export const flattenBuildingProperties = (
    building: CheckboardBuilding,
): FlatCheckboardProperty[] =>
    building.sections.flatMap((section) =>
        getSectionProperties(section).map((property) => ({
            ...property,
            sectionId: section.id,
            sectionName: section.name,
            column: resolveColumn(property, section),
            pricePerSqm: getPricePerSqm(property.price, property.area),
        })),
    )

export const findBuildingPropertyById = (
    building: CheckboardBuilding,
    propertyId: number,
) =>
    flattenBuildingProperties(building).find((property) => {
        if (property.id === propertyId) {
            return true
        }

        const externalId = Number(property.external_id)
        return Number.isFinite(externalId) && externalId === propertyId
    })

export const hasActiveCheckboardFilters = (filters: CheckboardFilters) =>
    Object.values(filters).some(
        (value) => value !== '' && value !== undefined && value !== null,
    )

export const matchesCheckboardFilters = (
    property: FlatCheckboardProperty | CheckboardProperty,
    filters: CheckboardFilters,
) => {
    const pricePerSqm =
        'pricePerSqm' in property
            ? property.pricePerSqm
            : getPricePerSqm(property.price, property.area)

    if (filters.typeCode && property.type.code !== filters.typeCode) return false
    if (filters.statusCode && property.status.code !== filters.statusCode)
        return false
    if (filters.rooms !== '' && filters.rooms !== undefined) {
        const rooms = Number(filters.rooms)
        if (rooms >= 4) {
            if (property.rooms_count < 4) return false
        } else if (property.rooms_count !== rooms) {
            return false
        }
    }
    if (filters.priceFrom !== '' && property.price < Number(filters.priceFrom))
        return false
    if (filters.priceTo !== '' && property.price > Number(filters.priceTo))
        return false
    if (filters.areaFrom !== '' && property.area < Number(filters.areaFrom))
        return false
    if (filters.areaTo !== '' && property.area > Number(filters.areaTo))
        return false
    if (
        filters.pricePerSqmFrom !== '' &&
        pricePerSqm < Number(filters.pricePerSqmFrom)
    )
        return false
    if (
        filters.pricePerSqmTo !== '' &&
        pricePerSqm > Number(filters.pricePerSqmTo)
    )
        return false
    return true
}

export const isPropertyActive = (
    property: CheckboardProperty,
    section: CheckboardSection,
    filters: CheckboardFilters,
) => {
    if (!hasActiveCheckboardFilters(filters)) return true
    return matchesCheckboardFilters(
        {
            ...property,
            sectionId: section.id,
            sectionName: section.name,
            column: resolveColumn(property, section),
            pricePerSqm: getPricePerSqm(property.price, property.area),
        },
        filters,
    )
}

export const DIMMED_CELL_CLASS =
    'opacity-30 grayscale contrast-75 saturate-0'

export const getSectionFloors = (section: CheckboardSection) => {
    const { min_floor, max_floor } = section.checkboard_data
    if (max_floor < min_floor) return []
    const floors: number[] = []
    for (let floor = max_floor; floor >= min_floor; floor -= 1) {
        floors.push(floor)
    }
    return floors
}

/** Максимальный этаж среди секций — для выравнивания без достройки этажей */
export const getBuildingMaxFloor = (sections: CheckboardSection[]) => {
    let maxFloor = -Infinity

    sections.forEach((section) => {
        const { min_floor, max_floor } = section.checkboard_data
        if (max_floor < min_floor) return
        maxFloor = Math.max(maxFloor, max_floor)
    })

    return Number.isFinite(maxFloor) ? maxFloor : null
}

export const getFloorAlignOffset = (
    section: CheckboardSection,
    buildingMaxFloor: number | null,
    rowPitchPx: number,
) => {
    if (buildingMaxFloor == null) return 0
    const { min_floor, max_floor } = section.checkboard_data
    if (max_floor < min_floor) return 0
    return Math.max(0, buildingMaxFloor - max_floor) * rowPitchPx
}

export const getPropertyAt = (
    section: CheckboardSection,
    floor: number,
    column: SectionColumn,
) => {
    if (Array.isArray(section.properties)) return undefined
    const list = section.properties[String(floor)] || []

    if (column.kind === 'stack') {
        return list.find((property) => property.stack_id === column.stackId)
    }

    return list.find(
        (property) =>
            property.stack_id == null &&
            property.checkboard_offset === column.offset,
    )
}

export const collectStatuses = (building: CheckboardBuilding) => {
    const map = new Map<
        string,
        {
            code: string
            name: string
            color: string
            text_color: string
        }
    >()
    flattenBuildingProperties(building).forEach((property) => {
        if (!map.has(property.status.code)) {
            map.set(property.status.code, {
                code: property.status.code,
                name: property.status.name,
                color: property.status.color,
                text_color: property.status.text_color,
            })
        }
    })
    return [...map.values()]
}

export const collectTypes = (building: CheckboardBuilding) => {
    const map = new Map<string, string>()
    flattenBuildingProperties(building).forEach((property) => {
        map.set(property.type.code, property.type.name)
    })
    return [...map.entries()].map(([code, name]) => ({ code, name }))
}

export const getBuildingStats = (
    building: CheckboardBuilding,
    filters: CheckboardFilters = emptyCheckboardFilters,
) => {
    const list = flattenBuildingProperties(building)
    const matching = hasActiveCheckboardFilters(filters)
        ? list.filter((item) => matchesCheckboardFilters(item, filters))
        : list
    return {
        total: matching.length,
        available: matching.filter((item) => item.status.is_available).length,
    }
}

const toFilterNumber = (value: number | '' | undefined) => {
    if (value === '' || value === undefined || value === null) return undefined
    return Number(value)
}

const matchesPremiseTypeFilter = (
    typeCode: string,
    selectedTypes: RealtyPropertyTypeCode[],
) => {
    if (selectedTypes.length === 0) return true

    const normalizedCode = normalizeRealtyPropertyTypeCode(typeCode)

    if (!normalizedCode) {
        return false
    }

    return selectedTypes.includes(normalizedCode)
}

export const matchesObjectsSearchFilters = (
    property: FlatCheckboardProperty,
    filters: ObjectsSearchFilters,
): boolean => {
    const selectedTypes = filters.type || []
    const priceFrom = toFilterNumber(filters.priceFrom)
    const priceTo = toFilterNumber(filters.priceTo)
    const areaFrom = toFilterNumber(filters.areaFrom)
    const areaTo = toFilterNumber(filters.areaTo)
    const floorFrom = toFilterNumber(filters.floorFrom)
    const floorTo = toFilterNumber(filters.floorTo)

    if (!matchesPremiseTypeFilter(property.type.code, selectedTypes)) {
        return false
    }

    if (
        !matchesRealtyRoomFilters(property, filters.rooms || [])
    ) {
        return false
    }

    if (priceFrom !== undefined && property.price < priceFrom) return false
    if (priceTo !== undefined && property.price > priceTo) return false
    if (areaFrom !== undefined && property.area < areaFrom) return false
    if (areaTo !== undefined && property.area > areaTo) return false
    if (floorFrom !== undefined && property.floor < floorFrom) return false
    if (floorTo !== undefined && property.floor > floorTo) return false

    return true
}
