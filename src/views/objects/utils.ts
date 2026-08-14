import type {
    FinishingType,
    HouseStatus,
    HouseType,
    Premise,
    RealtyPropertyTypeCode,
} from './types'
import { normalizeRealtyPropertyTypeCode } from './realtyPropertyQuery'

export const realtyPropertyTypeLabel: Record<RealtyPropertyTypeCode, string> = {
    property: 'Квартира',
    apartment: 'Апартаменты',
    parking: 'Парковка',
    office: 'Офис',
    pantry: 'Кладовая',
    free_destination: 'Свободного назначения',
}

export const getPremiseTypeLabel = (
    premise: Pick<Premise, 'typeCode' | 'typeName'>,
) => {
    if (premise.typeName) {
        return premise.typeName
    }

    const normalizedTypeCode = premise.typeCode
        ? normalizeRealtyPropertyTypeCode(premise.typeCode)
        : null

    if (normalizedTypeCode) {
        return realtyPropertyTypeLabel[normalizedTypeCode]
    }

    return '—'
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

export type PremiseSortField = 'price' | 'area' | 'floor'
export type PremiseSortDir = 'asc' | 'desc'
export type PremiseSortKey = `${PremiseSortField}_${PremiseSortDir}`
export type PremiseSortState = PremiseSortKey | null

export const premiseSortFields: Array<{
    value: PremiseSortField
    label: string
}> = [
    { value: 'price', label: 'Цена' },
    { value: 'area', label: 'Площадь' },
    { value: 'floor', label: 'Этаж' },
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

export const toPremiseSortParams = (key: PremiseSortKey) => {
    const { field, dir } = parsePremiseSortKey(key)

    return {
        sort_by: field,
        order: dir,
    }
}

export const countPremisesByComplex = (list: Premise[]) => {
    const counts: Record<string, number> = {}
    for (const item of list) {
        if (!item.complexId) continue
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
                return (a.price ?? 0) - (b.price ?? 0)
            case 'price_desc':
                return (b.price ?? 0) - (a.price ?? 0)
            case 'area_asc':
                return a.area - b.area
            case 'area_desc':
                return b.area - a.area
            case 'floor_asc':
                return a.floor - b.floor
            case 'floor_desc':
                return b.floor - a.floor
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

export const getPremisePricePerSqm = (
    price: number | undefined,
    area: number,
): number | undefined => {
    if (price === undefined || area <= 0) return undefined
    return Math.round(price / area)
}

export type PremisePreviewSlide = {
    src: string
    title?: string
}

export const getPremisePreviewSlides = (
    premise: Pick<Premise, 'layoutImage' | 'floorPlanImage'>,
): PremisePreviewSlide[] => {
    const slides: PremisePreviewSlide[] = []

    if (premise.layoutImage) {
        slides.push({ src: premise.layoutImage, title: 'Планировка' })
    }

    if (
        premise.floorPlanImage &&
        premise.floorPlanImage !== premise.layoutImage
    ) {
        slides.push({ src: premise.floorPlanImage, title: 'План этажа' })
    }

    return slides
}

export const getPremiseCoverImage = (
    premise: Pick<Premise, 'layoutImage' | 'floorPlanImage'>,
) => premise.layoutImage ?? premise.floorPlanImage

export const hasPremisePreviewImages = (
    premise: Pick<Premise, 'layoutImage' | 'floorPlanImage'>,
) => getPremisePreviewSlides(premise).length > 0

export const formatArea = (value: number) =>
    `${value.toLocaleString('ru-RU')} м²`

export const formatRoomsCount = (rooms: number) => {
    const mod10 = rooms % 10
    const mod100 = rooms % 100

    if (mod10 === 1 && mod100 !== 11) {
        return `${rooms} комната`
    }

    if (
        mod10 >= 2 &&
        mod10 <= 4 &&
        (mod100 < 10 || mod100 >= 20)
    ) {
        return `${rooms} комнаты`
    }

    return `${rooms} комнат`
}

export const formatCompletionDate = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return '—'

    const date = new Date(trimmed)
    if (Number.isNaN(date.getTime())) return trimmed

    return date.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
    })
}

export const roomsOptions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
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
