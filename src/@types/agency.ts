import { ProfilePicture } from "./auth"

export type AgencyItem = {
    id: number
    name: string
    form_days: number
}

export type GetAgenciesParams = {
    page?: number
    per_page?: number
}

export type GetAgenciesResponse = {
    data: AgencyItem[]
    meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

export type AgencyRequestStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | string

export type AgencyAgent = {
    id: number
    name: string
    email?: string | null
    phone: string
    country_code?: string
    roles?: string[]
    profile_picture?: ProfilePicture | null
}

export type AgencyShort = {
    id: number
    name: string
    form_days: number
}

export type AgencyUserShort = {
    id: number
    name: string
    phone: string
    email?: string
}

export type JoinAgencyRequest = {
    id: number
    status: AgencyRequestStatus
    agency?: AgencyShort | null
    agent?: AgencyAgent | null
    created_at: string
    updated_at?: string
}

export type CreateJoinAgencyRequestPayload = {
    agency_id?: number
    comment?: string
    [key: string]: unknown
}

export type GetAgencyRequestsParams = {
    page?: number
    per_page?: number
    status?: AgencyRequestStatus
    with?: string
    sort_by?: string
    order?: 'asc' | 'desc'
}

export type AgencyRequestsApiResponse = {
    data: JoinAgencyRequest[]
    meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}