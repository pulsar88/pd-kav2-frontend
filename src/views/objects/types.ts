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

/** Акция, привязанная к помещению (из special_offers) */
export type PremiseSpecialOffer = {
    id: number
    name: string
    active?: number
    color?: string
    text_color?: string
    description?: string
    start_date?: string
    end_date?: string
    badge_icon?: string | null
    badge_text?: string | null
}

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
    /** Акционная цена из discount_price */
    discountPrice?: number
    specialOffers?: PremiseSpecialOffer[]
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
    floorPath?: string
    complexImage?: string
    promoText?: string
    description?: string
    statusId?: number
    statusName?: string
    statusColor?: string
    baseStatus?: number
    isBaseStatus?: number
    status?: {
        id: number
        name: string
        external_id?: number
        color?: string
        base_status?: number
        is_base_status?: number
        show_as?: string | null
    }
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
    /** '' = все, '1' = да, '0' = нет */
    fromInvestor?: '' | '1' | '0'
    /**
     * Скрытый фильтр (не в форме объектов).
     * В URL — special_offer_id, в API — special_offer_id[].
     */
    specialOfferId?: string
    /** Фильтр по акциям на шахматке (мультивыбор) */
    specialOfferIds?: string[]
}
