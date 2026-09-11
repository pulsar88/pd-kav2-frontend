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
    properties_count?: number
}

export type SpecialOffersListResponse = {
    data: SpecialOffer[]
}

export type SpecialOfferDetailResponse = {
    data: SpecialOffer
}
