export type CheckboardPropertyType = {
    id: number
    name: string
    code: string
    account_id: number | null
    has_rooms: boolean
    has_good_area: boolean
    has_layout_type: boolean
}

export type CheckboardPropertyStatus = {
    id: number
    name: string
    code: string
    color: string
    text_color: string
    accent_color: string
    is_available: boolean
    is_booked: boolean
    is_sold: boolean
    is_unavailable: boolean
    account_id: number | null
}

export type CheckboardProperty = {
    id: number
    stack_id: number | null
    number: string
    external_id: string | null
    floor: number
    area: number
    good_area: number
    rooms_count: number
    studio: boolean
    euro: boolean
    free_destination: boolean
    price: number
    account_id: number
    checkboard_offset: number | null
    type: CheckboardPropertyType
    status: CheckboardPropertyStatus
    floor_plan_ids: number[]
    plans: unknown[]
}

export type CheckboardStack = {
    id: number
    checkboard_offset: number
    name: string
    account_id: number
    section_id: number
}

export type CheckboardSection = {
    id: number
    name: string
    account_id: number
    properties: Record<string, CheckboardProperty[]> | CheckboardProperty[]
    checkboard_data: {
        max_per_floor: number
        max_floor: number
        min_floor: number
    }
    stacks: CheckboardStack[]
}

export type CheckboardBuilding = {
    id: number
    name: string
    external_id: string | null
    account_id: number
    sections: CheckboardSection[]
}

export type CheckboardCellLabel = 'rooms' | 'number'

export type CheckboardFilters = {
    typeCode: string
    rooms: number | ''
    priceFrom: number | ''
    priceTo: number | ''
    areaFrom: number | ''
    areaTo: number | ''
    pricePerSqmFrom: number | ''
    pricePerSqmTo: number | ''
    statusCode: string
}

export type FlatCheckboardProperty = CheckboardProperty & {
    sectionId: number
    sectionName: string
    column: number
    pricePerSqm: number
}

export type SectionColumn = {
    key: string
    kind: 'offset' | 'stack'
    offset?: number
    stackId?: number
    label: string
}

