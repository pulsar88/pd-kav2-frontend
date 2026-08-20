import type {
    CheckboardBuilding,
    CheckboardProperty,
    CheckboardPropertyStatus,
    CheckboardPropertyType,
    CheckboardSection,
} from './checkboard.types'

type ChessPropertyStatusApi = {
    id: number
    name: string
    external_id: number
    color: string
    base_status: number
    is_base_status: number
}

type ChessPropertyTypeApi = {
    value: string
    code: string
    name: string
}

type ChessPropertyApi = {
    id: number
    number: string
    section: string
    floor: number
    area: number
    good_area: number
    type: ChessPropertyTypeApi
    rooms_count: number
    external_id: number
    price?: number
    studio?: boolean
    euro?: boolean
    free_destination?: boolean
    status: ChessPropertyStatusApi
}

type ChessSectionApi = {
    id: number
    name: string
    properties: Record<string, ChessPropertyApi[]>
    checkboard_data: {
        max_per_floor: number
        max_floor: number
        min_floor: number
    }
}

export type ChessBuildingApi = {
    id: number
    name: string
    external_id: number
    sections: ChessSectionApi[]
}

const ROOM_TYPE_CODES = new Set(['property', 'apartment', 'apartments'])

const getContrastTextColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '')
    if (hex.length !== 6) return '#ffffff'

    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    return luminance > 0.62 ? '#111827' : '#ffffff'
}

const mapType = (type: ChessPropertyTypeApi): CheckboardPropertyType => {
    const code = type.code.toLowerCase()
    const hasRooms = ROOM_TYPE_CODES.has(code)

    return {
        id: 0,
        name: type.name,
        code,
        account_id: null,
        has_rooms: hasRooms,
        has_good_area: true,
        has_layout_type: hasRooms,
    }
}

const mapStatus = (status: ChessPropertyStatusApi): CheckboardPropertyStatus => {
    const isAvailable = status.base_status === 10
    const isBooked = status.base_status === 20

    return {
        id: status.id,
        name: status.name,
        code: String(status.external_id),
        color: status.color,
        text_color: getContrastTextColor(status.color),
        is_available: isAvailable,
        is_booked: isBooked,
        is_sold: status.base_status === 30,
        is_unavailable: !isAvailable && !isBooked && status.base_status !== 30,
        account_id: null,
    }
}

const mapProperty = (
    item: ChessPropertyApi,
    checkboardOffset: number,
): CheckboardProperty => ({
    id: item.id,
    stack_id: null,
    number: item.number,
    external_id: String(item.external_id),
    floor: item.floor,
    area: item.area,
    good_area: item.good_area,
    rooms_count: item.rooms_count,
    studio: item.studio ?? false,
    euro: item.euro ?? false,
    free_destination: item.free_destination ?? false,
    price: item.price ?? 0,
    account_id: 0,
    checkboard_offset: checkboardOffset,
    type: mapType(item.type),
    status: mapStatus(item.status),
    floor_plan_ids: [],
    plans: [],
})

const mapSectionProperties = (
    properties: Record<string, ChessPropertyApi[]>,
): Record<string, CheckboardProperty[]> => {
    const result: Record<string, CheckboardProperty[]> = {}

    Object.entries(properties).forEach(([floor, items]) => {
        result[floor] = items.map((item, index) =>
            mapProperty(item, index + 1),
        )
    })

    return result
}

const mapSection = (section: ChessSectionApi): CheckboardSection => ({
    id: section.id,
    name: section.name,
    account_id: 0,
    properties: mapSectionProperties(section.properties),
    checkboard_data: section.checkboard_data,
    stacks: [],
})

export const mapChessToCheckboardBuilding = (
    data: ChessBuildingApi,
): CheckboardBuilding => ({
    id: data.id,
    name: data.name,
    external_id: String(data.external_id),
    account_id: 0,
    sections: data.sections.map(mapSection),
})
