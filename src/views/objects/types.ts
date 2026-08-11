export type PremiseType = 'apartment' | 'apartments' | 'commercial'
export type HouseType = 'monolith' | 'brick' | 'panel'
export type FinishingType = 'none' | 'rough' | 'fine'
export type HouseStatus = 'under_construction' | 'commissioned'

export type Complex = {
    id: string
    name: string
    address: string
    image: string
    apartmentsCount: number
    priceFrom: number
    pricePerSqm: number
    completionDate: string
    houseType: HouseType
    houseStatus: HouseStatus
    floors: number
    finishing: FinishingType
}

export type Premise = {
    id: string
    checkboardPropertyId: number
    complexId: string
    complexName: string
    address: string
    number: string
    type: PremiseType
    rooms: number
    area: number
    floor: number
    floorsInBuilding: number
    price: number
    pricePerSqm: number
    houseType: HouseType
    finishing: FinishingType
    houseStatus: HouseStatus
    deliveryDate: string
    ceilingHeight?: number
    layout?: string
    layoutImage: string
    description?: string
}

export type ObjectsSearchFilters = {
    type?: PremiseType[]
    complexIds?: string[]
    complexId?: string
    rooms?: number[]
    priceFrom?: number | ''
    priceTo?: number | ''
    areaFrom?: number | ''
    areaTo?: number | ''
    floorFrom?: number | ''
    floorTo?: number | ''
}
