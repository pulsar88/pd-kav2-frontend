import { ProfilePicture } from './auth'

export type AgencyAgentAccessLevel = {
    value?: number | string
    code?: string
    name?: string
}

export type AgencyAgentBonus = {
    value?: string
    code?: string
    name?: string
}

export type AgencyAgent = {
    id: number
    name: string
    email?: string | null
    phone: string
    country_code?: string
    roles?: string[]
    access_level?: AgencyAgentAccessLevel | null
    access_level_expires_at?: string | null
    bonuses?: AgencyAgentBonus[]
    profile_picture?: ProfilePicture | null
}

export type AgencyItem = {
    id: number
    name: string
    fix_days: number
    is_aggregator?: number
    agents?: AgencyAgent[]
}

export type GetAgenciesParams = {
    page?: number
    per_page?: number
    search?: string
    with?: string
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

export type AgencyUserShort = {
    id: number
    name: string
    phone: string
    email?: string
}

export type AgencyShort = {
    id: number
    name: string
    fix_days: number
    supervisor?: AgencyUserShort | null
}

export type JoinAgencyRequest = {
    id: number
    status: AgencyRequestStatus
    agency?: AgencyShort | null
    agent?: AgencyAgent | null
    supervisor?: AgencyUserShort | null
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
