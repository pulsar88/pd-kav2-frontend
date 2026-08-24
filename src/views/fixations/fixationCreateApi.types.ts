export type FixationCreateClientPhoneApi = {
    id: number
    phone: string
    country_code?: string
}

export type FixationCreateClientApi = {
    id: number
    name?: string | null
    second_name?: string | null
    last_name?: string | null
    phones?: FixationCreateClientPhoneApi[]
}

export type FixationCreateManagerApi = {
    id: number
    name: string
    external_id?: number
}

export type FixationCreateClientsApiResponse = {
    data: FixationCreateClientApi[]
    meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

export type FixationCreateManagersApiResponse = {
    data: FixationCreateManagerApi[]
    meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

export type CreateFixationApiBody = {
    object_id: number
    manager_id: number
    client_id?: number
    client?: {
        name: string
        second_name?: string
        last_name?: string
        phones: {
            phone: string
            country_code: string
        }[]
    }
    // TODO(api): раскомментировать, когда POST /v2/fixations начнёт принимать поля
    // property_id?: number
    comment?: string
    preferred_area?: string
    preferred_rooms_count?: string
    preferred_payment?: string
    budget?: string
    meeting_date?: string
    // relatives?: Array<{ client_id: number; relation: string }>
}
