export type PremiseType = 'apartment' | 'apartments' | 'commercial'

export type RealtyPropertyTypeCode =
    | 'property'
    | 'apartment'
    | 'parking'
    | 'office'
    | 'pantry'
    | 'free_destination'
export type HouseType = 'monolith' | 'brick' | 'panel'
export type FinishingType = 'none' | 'rough' | 'fine'
export type HouseStatus = 'under_construction' | 'commissioned'

export type RealtyProject = {
    id: string
    name: string
}

export type RealtyFilterOption = {
    value: string
    label: string
}

export type RealtyPropertiesFilters = {
    projects: RealtyProject[]
    realtyTypes: RealtyFilterOption[]
    realtyRooms: RealtyFilterOption[]
}

export type Complex = {
    id: string
    name: string
    externalId?: number
    address?: string
    image?: string
    apartmentsCount?: number
    priceFrom?: number
    pricePerSqm?: number
    completionDate?: string
    houseType?: HouseType
    houseStatus?: HouseStatus
    floors?: number
    finishing?: FinishingType
    matchingPremisesCount?: number
    promoText?: string
}

export type Premise = {
    id: string
    checkboardPropertyId: number
    number: string
    type: PremiseType
    typeCode?: RealtyPropertyTypeCode | string
    rooms: number
    area: number
    floor: number
    externalId?: number
    goodArea?: number
    section?: string
    typeName?: string
    complexId?: string
    complexName?: string
    address?: string
    floorsInBuilding?: number
    price?: number
    pricePerSqm?: number
    houseType?: HouseType
    finishing?: FinishingType
    houseStatus?: HouseStatus
    buildingState?: string
    deliveryDate?: string
    developmentStart?: string
    facing?: string
    material?: string
    ceilingHeight?: number
    layout?: string
    layoutName?: string
    layoutImage?: string
    floorPlanImage?: string
    complexImage?: string
    promoText?: string
    description?: string
}

export type ObjectsSearchFilters = {
    type?: RealtyPropertyTypeCode[]
    realtyProjectIds?: string[]
    complexId?: string
    rooms?: string[]
    priceFrom?: number | ''
    priceTo?: number | ''
    areaFrom?: number | ''
    areaTo?: number | ''
    floorFrom?: number | ''
    floorTo?: number | ''
}
