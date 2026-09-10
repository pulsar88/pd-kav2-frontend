import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import { unwrapApiData } from '@/services/auth/authUtils'
import type { ApiDataEnvelope } from '@/services/auth/authUtils'
import type {
    CreateInvitationPayload,
    GetInvitationsParams,
    Invitation,
    InvitationsListResponse,
    UpdateInvitationPayload,
} from '@/@types/invitation'

export async function apiGetInvitations(
    params: GetInvitationsParams = {},
): Promise<InvitationsListResponse> {
    const response = await ApiService.fetchDataWithAxios<
        InvitationsListResponse | Invitation[]
    >({
        url: endpointConfig.invitations,
        method: 'get',
        params: {
            with: 'agency',
            sort_by: 'created_at',
            order: 'desc',
            ...params,
        },
    })

    if (Array.isArray(response)) {
        return {
            data: response,
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: response.length,
                total: response.length,
            },
        }
    }

    return {
        data: response.data ?? [],
        meta: response.meta,
    }
}

export async function apiCreateInvitation(
    data: CreateInvitationPayload = {},
): Promise<Invitation> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<Invitation> | Invitation
    >({
        url: endpointConfig.invitations,
        method: 'post',
        data,
    })

    return unwrapApiData(response)
}

export async function apiGetInvitation(
    invitation: string | number,
): Promise<Invitation> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<Invitation> | Invitation
    >({
        url: endpointConfig.invitation(invitation),
        method: 'get',
    })

    return unwrapApiData(response)
}

export async function apiUpdateInvitation(
    invitation: string | number,
    data: UpdateInvitationPayload,
): Promise<Invitation> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<Invitation> | Invitation
    >({
        url: endpointConfig.invitation(invitation),
        method: 'put',
        data,
    })

    return unwrapApiData(response)
}

export async function apiDeleteInvitation(
    invitation: string | number,
): Promise<void> {
    await ApiService.fetchDataWithAxios({
        url: endpointConfig.invitation(invitation),
        method: 'delete',
    })
}

export async function apiCheckInvitation(
    invitation: string | number,
): Promise<Invitation> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<Invitation> | Invitation
    >({
        url: endpointConfig.invitationCheck(invitation),
        method: 'get',
    })

    return unwrapApiData(response)
}

export async function apiLinkInvitation(
    invitation: string | number,
): Promise<Invitation> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<Invitation> | Invitation
    >({
        url: endpointConfig.invitationLink(invitation),
        method: 'post',
    })

    return unwrapApiData(response)
}
