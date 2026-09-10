import type { PremiseSpecialOffer } from './types'

export const toFiniteNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

export const resolveDiscountPrice = (
    raw: unknown,
    options?: {
        basePrice?: number
        hasOffers?: boolean
    },
): number | undefined => {
    const discount = toFiniteNumber(raw)
    if (discount == null || discount <= 0) return undefined

    const { basePrice, hasOffers } = options ?? {}
    if (hasOffers) return discount
    if (basePrice == null) return discount
    // Не считаем «акцией», если цена совпадает с обычной и акций нет
    if (discount >= basePrice) return undefined
    return discount
}

/** Всегда массив: [] если акций нет */
export const resolveSpecialOffers = (raw: unknown): PremiseSpecialOffer[] => {
    const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object'
          ? [raw]
          : []

    if (list.length === 0) return []

    const offers: PremiseSpecialOffer[] = []

    list.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const offer = item as Record<string, unknown>
        const id = toFiniteNumber(offer.id)
        if (id == null) return

        const mapped: PremiseSpecialOffer = {
            id,
            name: String(offer.name ?? ''),
            badge_icon:
                (offer.badge_icon as string | null | undefined) ??
                (offer.badgeIcon as string | null | undefined) ??
                null,
            badge_text:
                (offer.badge_text as string | null | undefined) ??
                (offer.badgeText as string | null | undefined) ??
                null,
        }

        const active = toFiniteNumber(offer.active)
        if (active != null) mapped.active = active

        if (typeof offer.color === 'string') mapped.color = offer.color

        if (typeof offer.text_color === 'string') {
            mapped.text_color = offer.text_color
        } else if (typeof offer.textColor === 'string') {
            mapped.text_color = offer.textColor
        }

        if (typeof offer.description === 'string') {
            mapped.description = offer.description
        }

        if (typeof offer.start_date === 'string') {
            mapped.start_date = offer.start_date
        } else if (typeof offer.startDate === 'string') {
            mapped.start_date = offer.startDate
        }

        if (typeof offer.end_date === 'string') {
            mapped.end_date = offer.end_date
        } else if (typeof offer.endDate === 'string') {
            mapped.end_date = offer.endDate
        }

        offers.push(mapped)
    })

    return offers
}

export const hasPremiseDiscount = (premise: {
    discountPrice?: number
    price?: number
    specialOffers?: PremiseSpecialOffer[]
}) =>
    resolveDiscountPrice(premise.discountPrice, {
        basePrice: premise.price,
        hasOffers: Boolean(premise.specialOffers?.length),
    }) != null

export const CHECKBOARD_SPECIAL_OFFER_STATUS_CODE = 'special_offer'

export const CHECKBOARD_SPECIAL_OFFER_STATUS = {
    code: CHECKBOARD_SPECIAL_OFFER_STATUS_CODE,
    name: 'Акции',
    color: '#f59e0b',
    text_color: '#111827',
} as const

export const getSpecialOfferFilterIds = (filters: {
    specialOfferId?: string
    specialOfferIds?: string[]
}) => {
    const ids = [
        ...(filters.specialOfferIds ?? []),
        ...(filters.specialOfferId ? [filters.specialOfferId] : []),
    ]
    return [...new Set(ids.map(String).filter(Boolean))]
}

export const propertyHasSpecialOffer = (property: {
    special_offers?: unknown[] | null
}) =>
    Array.isArray(property.special_offers) &&
    property.special_offers.length > 0

/**
 * Статус «Акции» — дополнительное условие (AND):
 * при включении показывает только помещения с акциями среди выбранных статусов.
 */
export const matchesCheckboardStatusFilter = (
    property: {
        status: { code: string }
        special_offers?: unknown[] | null
    },
    activeStatusCodes: string[],
) => {
    if (activeStatusCodes.length === 0) return true

    const offerSelected = activeStatusCodes.includes(
        CHECKBOARD_SPECIAL_OFFER_STATUS_CODE,
    )
    const regularCodes = activeStatusCodes.filter(
        (code) => code !== CHECKBOARD_SPECIAL_OFFER_STATUS_CODE,
    )

    if (regularCodes.length > 0) {
        if (!regularCodes.includes(property.status.code)) return false
    } else if (!offerSelected) {
        return true
    }

    if (offerSelected && !propertyHasSpecialOffer(property)) {
        return false
    }

    return true
}
