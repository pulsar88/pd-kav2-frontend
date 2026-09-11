import type { AgencyAgent, AgencyShort } from './agency'

export type InvitationStatus =
    | 'pending'
    | 'accepted'
    | 'expired'
    | 'revoked'
    | string

export type Invitation = {
    id: number
    token?: string
    invitation?: string
    status?: InvitationStatus
    agency_id?: number
    agency?: AgencyShort | null
    inviter?: AgencyAgent | null
    active?: boolean
    used?: boolean
    permanent?: boolean
    active_till?: string | null
    expires_at?: string | null
    used_at?: string | null
    accepted_at?: string | null
    created_at?: string
    updated_at?: string
}

export type CreateInvitationPayload = {
    active?: boolean
    permanent?: boolean
    active_till?: string | null
    [key: string]: unknown
}

export type UpdateInvitationPayload = {
    active?: boolean
    permanent?: boolean
    active_till?: string | null
    [key: string]: unknown
}

export type GetInvitationsParams = {
    page?: number
    per_page?: number
    with?: string
    sort_by?: string
    order?: 'asc' | 'desc'
}

export type InvitationsListResponse = {
    data: Invitation[]
    meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

export const getInvitationToken = (invitation: Invitation): string =>
    invitation.token || invitation.invitation || String(invitation.id)
