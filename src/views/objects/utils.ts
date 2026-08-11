import type {
    FinishingType,
    HouseStatus,
    HouseType,
    Premise,
    PremiseType,
} from './types'

export const premiseTypeLabel: Record<PremiseType, string> = {
    apartment: 'Квартира',
    apartments: 'Апартаменты',
    commercial: 'Коммерция',
}

export const houseTypeLabel: Record<HouseType, string> = {
    monolith: 'Монолит',
    brick: 'Кирпич',
    panel: 'Панель',
}

export const finishingLabel: Record<FinishingType, string> = {
    none: 'Без отделки',
    rough: 'Черновая',
    fine: 'Чистовая',
}

export const houseStatusLabel: Record<HouseStatus, string> = {
    under_construction: 'Строится',
    commissioned: 'Сдан',
}

export type PremiseSortField = 'price' | 'area' | 'rooms'
export type PremiseSortDir = 'asc' | 'desc'
export type PremiseSortKey = `${PremiseSortField}_${PremiseSortDir}`

export const premiseSortFields: Array<{
    value: PremiseSortField
    label: string
}> = [
    { value: 'price', label: 'Цена' },
    { value: 'area', label: 'Площадь' },
    { value: 'rooms', label: 'Комнаты' },
]

export const toPremiseSortKey = (
    field: PremiseSortField,
    dir: PremiseSortDir,
): PremiseSortKey => `${field}_${dir}`

export const parsePremiseSortKey = (
    key: PremiseSortKey,
): { field: PremiseSortField; dir: PremiseSortDir } => {
    const [field, dir] = key.split('_') as [PremiseSortField, PremiseSortDir]
    return { field, dir }
}

export const countPremisesByComplex = (list: Premise[]) => {
    const counts: Record<string, number> = {}
    for (const item of list) {
        counts[item.complexId] = (counts[item.complexId] || 0) + 1
    }
    return counts
}

export const sortPremises = (
    list: Premise[],
    sortKey: PremiseSortKey,
): Premise[] => {
    const sorted = [...list]

    sorted.sort((a, b) => {
        switch (sortKey) {
            case 'price_asc':
                return a.price - b.price
            case 'price_desc':
                return b.price - a.price
            case 'area_asc':
                return a.area - b.area
            case 'area_desc':
                return b.area - a.area
            case 'rooms_asc':
                return a.rooms - b.rooms
            case 'rooms_desc':
                return b.rooms - a.rooms
            default:
                return 0
        }
    })

    return sorted
}

export const formatPrice = (value: number) =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(value)

export const formatArea = (value: number) =>
    `${value.toLocaleString('ru-RU')} м²`

export const formatCompletionDate = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
    })
}

export const roomsOptions = [
    { value: 0, label: 'Студия' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4+' },
]

export const deliveryOptions = [
    { value: '2026-Q2', label: '2 кв. 2026' },
    { value: '2026-Q4', label: '4 кв. 2026' },
    { value: '2027-Q2', label: '2 кв. 2027' },
    { value: '2027-Q4', label: '4 кв. 2027' },
    { value: '2028-Q2', label: '2 кв. 2028' },
]

export const matchesDelivery = (deliveryDate: string, filter?: string) => {
    if (!filter) return true
    const date = new Date(deliveryDate)
    if (Number.isNaN(date.getTime())) return false

    const year = date.getFullYear()
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return filter === `${year}-Q${quarter}`
}
