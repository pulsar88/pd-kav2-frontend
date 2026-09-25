export type SpecialOffer = {
    id: number
    name: string
    active: number
    color: string
    text_color: string
    description: string
    start_date: string
    end_date: string
    badge_icon: string | null
    badge_text: string | null
    has_discount: boolean
    properties_count?: number
}

export type SpecialOffersListResponse = {
    data: SpecialOffer[]
    meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

export type SpecialOfferDetailResponse = {
    data: SpecialOffer
}

export type GetSpecialOffersParams = {
    page?: number
    per_page?: number
    [key: string]: unknown
}
