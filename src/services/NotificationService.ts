import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import { unwrapApiData, type ApiDataEnvelope } from './auth/authUtils'
import { emitUserLogsReaded } from '@/services/broadcast/userLogsBroadcastBus'
import { parseNotificationDictionaries, normalizeUserLogs } from '@/utils/notificationDictionary'
import type {
    GetUserLogsParams,
    MarkUserLogsReadPayload,
    NotificationDictionaries,
    NotificationPreference,
    UpdateNotificationPreferencesPayload,
    UserLogsApiResponse,
    UserLogsResponse,
} from '@/@types/notification'

export async function apiGetUserLogs(
    params?: GetUserLogsParams,
): Promise<UserLogsResponse> {
    const { notificationTypes, is_unread, page, types, ...rest } = params ?? {}

    const queryParams: Record<string, string | number> = { ...rest }

    if (page !== undefined) {
        queryParams.page = page
    }

    if (is_unread !== undefined) {
        queryParams.is_unread = is_unread ? 1 : 0
    }

    if (types?.length) {
        types.forEach((typeId, index) => {
            queryParams[`types[${index}]`] = typeId
        })
    }

    const response = await ApiService.fetchDataWithAxios<UserLogsApiResponse>({
        url: endpointConfig.userLogs,
        method: 'get',
        params: queryParams,
    })

    return {
        data: normalizeUserLogs(response.data, notificationTypes),
        meta: response.meta,
    }
}

export async function apiGetUnreadLogsCount(): Promise<number> {
    const response = await ApiService.fetchDataWithAxios<
        number | { data: number }
    >({
        url: endpointConfig.logsUnreadCount,
        method: 'get',
    })

    const unwrapped = unwrapApiData(response)
    return typeof unwrapped === 'number' ? unwrapped : Number(unwrapped) || 0
}

export async function apiMarkUserLogsAsRead(data: MarkUserLogsReadPayload) {
    const response = await ApiService.fetchDataWithAxios({
        url: endpointConfig.userLogsRead,
        method: 'patch',
        data,
    })

    if (data.ids.length > 0) {
        emitUserLogsReaded(data.ids)
    }

    return response
}

export async function apiGetNotificationPreferences() {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<NotificationPreference[]>
    >({
        url: endpointConfig.userNotificationPreferences,
        method: 'get',
    })
    return unwrapApiData(response)
}

export async function apiGetNotificationDictionaries() {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<NotificationDictionaries> | NotificationDictionaries
    >({
        url: endpointConfig.userNotificationDictionaries,
        method: 'get',
    })

    return parseNotificationDictionaries(response)
}

export async function apiUpdateNotificationPreferences(
    data: UpdateNotificationPreferencesPayload,
) {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.userNotificationPreferences,
        method: 'put',
        data,
    })
}
