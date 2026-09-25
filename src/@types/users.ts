import type { AccessLevel, AgencyBrief, ProfilePicture, UserBonus } from './auth'

export type AdminUserListItem = {
    id: number
    name: string
    blocked?: number | boolean
    email: string | null
    phone: string
    country_code?: string
    agency?: AgencyBrief | null
    profile_picture?: ProfilePicture | null
    access_level?: AccessLevel | null
    access_level_expires_at?: string | null
    bonuses?: UserBonus[] | null
    roles?: string[]
}

export type GetUsersParams = {
    page?: number
    per_page?: number
    search?: string
    with?: string
    agency_id?: number | string
}

export type GetUsersResponse = {
    data: AdminUserListItem[]
    meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

export type ChangeUserAgencyPayload = {
    agency_id: number
}
