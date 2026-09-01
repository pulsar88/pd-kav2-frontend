import dayjs from 'dayjs'
import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import { getFixationsDashboardStats } from '@/views/fixations/fixationsDashboardMockData'
import type { FixationsDashboardStats } from '@/views/fixations/dashboard.constants'
import type { Complex } from '@/views/objects/types'
import { apiGetRealtyPropertiesSummary } from '@/services/ObjectsService'
import type {
    CreateFixationClientPayload,
    CreateFixationWizardPayload,
    FixationClient,
    FixationComplex,
    GetFixationClientsParams,
    GetFixationClientsResponse,
    GetFixationHousesParams,
    GetFixationHousesResponse,
    GetFixationManagersParams,
    GetFixationManagersResponse,
} from '@/views/fixations/createWizard.types'
import {
    mapCreateFixationPayloadToApiBody,
    mapFixationCreateClientApiToClient,
    mapFixationCreateManagerApiToManager,
} from '@/views/fixations/fixationCreateMapper'
import type {
    FixationCreateClientApi,
    FixationCreateClientsApiResponse,
    FixationCreateManagersApiResponse,
} from '@/views/fixations/fixationCreateApi.types'
import { mapFixationApiItemToFixation, unwrapFixationApiResponse } from '@/views/fixations/fixationApiMapper'
import {
    buildFixationDetailsParams,
    buildFixationsListParams,
} from '@/views/fixations/fixationApiQuery'
import type {
    FixationApiItem,
    FixationsApiMeta,
    FixationsApiResponse,
    GetFixationsParams,
} from '@/views/fixations/fixationApi.types'
import type { Fixation, GetFixationsResponse } from '@/views/fixations/types'
import { serializeRuPhoneForApi } from '@/views/fixations/utils'
import { toAxiosParams } from '@/views/objects/realtyPropertyQuery'

const DEFAULT_CLIENTS_PAGE_SIZE = 20
const DEFAULT_MANAGERS_PAGE_SIZE = 20
const DEFAULT_HOUSES_PER_PAGE = 20

const delay = (ms = 200) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms)
    })

const toListMeta = (
    meta:
        | {
              current_page?: number
              last_page?: number
              per_page?: number
              total?: number
          }
        | undefined,
    fallback: {
        page: number
        perPage: number
        total: number
    },
) => ({
    current_page: meta?.current_page ?? fallback.page,
    // Without meta assume a single page to avoid infinite reload loops
    last_page: meta?.last_page ?? 1,
    per_page: meta?.per_page ?? fallback.perPage,
    total: meta?.total ?? fallback.total,
})

export async function apiGetFixationsDashboardStats(
    month: string,
): Promise<FixationsDashboardStats> {
    await delay()
    return getFixationsDashboardStats(month)
}

export async function apiGetFixations(
    params: GetFixationsParams = {},
): Promise<GetFixationsResponse> {
    const response = await ApiService.fetchDataWithAxios<FixationsApiResponse>({
        url: endpointConfig.fixations,
        method: 'get',
        params: buildFixationsListParams(params),
    })

    return {
        list: response.data.map(mapFixationApiItemToFixation),
        total: response.meta.total,
        meta: response.meta,
    }
}

export async function apiGetFixation(id: string): Promise<Fixation | null> {
    const response = await ApiService.fetchDataWithAxios<
        FixationApiItem | { data?: FixationApiItem | null }
    >({
        url: endpointConfig.fixation(id),
        method: 'get',
        params: buildFixationDetailsParams(),
    })

    const item = unwrapFixationApiResponse(response)
    if (!item) {
        return null
    }

    return mapFixationApiItemToFixation(item)
}

export async function apiGetFixationClients(
    params: GetFixationClientsParams = {},
): Promise<GetFixationClientsResponse> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.max(1, params.page_size ?? DEFAULT_CLIENTS_PAGE_SIZE)
    const search = params.q?.trim()

    const response =
        await ApiService.fetchDataWithAxios<FixationCreateClientsApiResponse>({
            url: endpointConfig.clients,
            method: 'get',
            params: toAxiosParams({
                page,
                page_size: pageSize,
                with: 'phones',
                ...(search ? { search } : {}),
            }),
        })

    return {
        list: response.data.map(mapFixationCreateClientApiToClient),
        total: response.meta.total,
    }
}

export async function apiGetFixationManagers(
    params: GetFixationManagersParams = {},
): Promise<GetFixationManagersResponse> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.max(1, params.page_size ?? DEFAULT_MANAGERS_PAGE_SIZE)

    const response =
        await ApiService.fetchDataWithAxios<FixationCreateManagersApiResponse>(
            {
                url: endpointConfig.managers,
                method: 'get',
                params: toAxiosParams({
                    page,
                    page_size: pageSize,
                    ...(params.object_id != null
                        ? { object_id: params.object_id }
                        : {}),
                }),
            },
        )

    const list = response.data.map(mapFixationCreateManagerApiToManager)

    return {
        list,
        meta: toListMeta(response.meta, {
            page,
            perPage: pageSize,
            total: list.length,
        }),
    }
}

const mapComplexToFixationComplex = (item: Complex): FixationComplex => ({
    id: item.id,
    name: item.name,
    address: item.address?.trim() || '',
    apartments: [],
    managers: [],
})

export async function apiGetFixationHouses(
    params: GetFixationHousesParams = {},
): Promise<GetFixationHousesResponse> {
    const page = Math.max(1, params.page ?? 1)
    const perPage = Math.max(1, params.per_page ?? DEFAULT_HOUSES_PER_PAGE)

    const response = await apiGetRealtyPropertiesSummary({
        page,
        per_page: perPage,
    })

    return {
        list: response.items.map(mapComplexToFixationComplex),
        meta: toListMeta(response.meta, {
            page,
            perPage,
            total: response.items.length,
        }),
    }
}

export async function apiCreateFixation(
    data: CreateFixationWizardPayload,
): Promise<{data: Fixation}> {
    const response = await ApiService.fetchDataWithAxios<{data:Fixation}>({
        url: endpointConfig.fixations,
        method: 'post',
        data: mapCreateFixationPayloadToApiBody(data),
    })

    return response
}

/**
 * Устанавливает дополнительных клиентов для фиксации
 * @param fixationId - id фиксации
 * @param clients - массив клиентов
 * @param clients.client_id - id клиента
 * @param clients.relation - отношение к клиенту
 * @returns void
 */
export async function apiSetRelatedClientsForFixation({
    fixationId,
    clients,
}: {
    fixationId: string
    clients: { client_id: number; relation: number }[]
}
): Promise<void> {
    await ApiService.fetchDataWithAxios({
        url: endpointConfig.fixationRelatedClients(fixationId),
        method: 'post',
        data: {clients: clients},
    })
}

export async function apiCreateFixationClient(
    data: CreateFixationClientPayload,
): Promise<FixationClient> {
    const response = await ApiService.fetchDataWithAxios<
        FixationCreateClientApi | { data: FixationCreateClientApi }
    >({
        url: endpointConfig.clients,
        method: 'post',
        data: {
            name: data.firstName.trim(),
            second_name: data.lastName.trim(),
            last_name: data.middleName?.trim() || undefined,
            phones: [
                {
                    phone: serializeRuPhoneForApi(data.phone),
                    country_code: 'RU',
                },
            ],
        },
    })

    const item =
        'data' in response &&
        response.data &&
        typeof response.data === 'object' &&
        'id' in response.data
            ? response.data
            : (response as unknown as FixationCreateClientApi)

    return mapFixationCreateClientApiToClient(item)
}

export type CreateFixationExtendRequestPayload = {
    fixation_id: number | string
    add_days: number | string
    comment?: string
}

export async function apiCreateFixationExtendRequest(
    payload: CreateFixationExtendRequestPayload,
): Promise<void> {
    const fixationId = parseInt(String(payload.fixation_id), 10)
    const addDays = parseInt(String(payload.add_days), 10)

    const data: Record<string, unknown> = {
        fixation_id: Number.isNaN(fixationId)
            ? Number(payload.fixation_id)
            : fixationId,
        add_days: Number.isNaN(addDays) ? Number(payload.add_days) : addDays,
    }

    if (payload.comment?.trim()) {
        data.comment = payload.comment.trim()
    }

    await ApiService.fetchDataWithAxios({
        url: endpointConfig.fixationExtendRequests,
        method: 'post',
        data,
    })
}

export type FixationExtendRequest = {
    id: number | string
    add_days?: number
    extend_days?: number
    days?: number
    comment?: string | null
    created_at?: string
    updated_at?: string
    status?: string | { value?: string; name?: string; code?: string }
    fixation_id?: number | string
    fixation?: {
        id: number | string
        status?:
            | {
                  value?: string
                  code?: string
                  name?: string
              }
            | string
        max_fix_days?: number
        fixed_till?: string | null
        comment?: string | null
        budget?: number
        meeting_date?: string | null
        preferred_rooms_count?: number | null
        preferred_area?: number | null
        preferred_payment?: string | null
        created_at?: string
        has_extend_request?: boolean
        agent?: {
            id?: number | string
            name?: string
            email?: string | null
            phone?: string | null
            country_code?: string
            roles?: string[]
            agency?: { name?: string } | string
        }
        client?: {
            id?: number | string
            name?: string
            second_name?: string
            last_name?: string
            phone?: string
            phones?: Array<{ phone: string }>
        }
        object?: {
            id?: number | string
            name?: string
            address?: string
            facing?: string
            material?: string
            building_state?: {
                value?: string
                code?: string
                name?: string
            }
            development_start?: string
            development_end?: string
            external_id?: number
        }
        // Additional properties if parsed Fixation
        fullName?: string
        phone?: string
        projectName?: string
        objectName?: string
        address?: string
    } | null
    agent?: {
        id?: number | string
        name?: string
        email?: string | null
        phone?: string | null
        roles?: string[]
        agency?: { name?: string } | string
    }
    client?: {
        id?: number | string
        name?: string
        second_name?: string
        last_name?: string
        phone?: string
        phones?: Array<{ phone: string }>
    }
    object?: {
        id?: number | string
        name?: string
        address?: string
    }
}

export type RestoreFixationPayload = {
    amocrm_status_id?: number
    fixed_till?: string | number | Date
}

export async function apiGetFixationExtendRequests(params?: {
    page?: number
    page_size?: number
    search?: string
    with?: string
}): Promise<{ list: FixationExtendRequest[]; total: number }> {
    const queryParams: Record<string, unknown> = {
        with: 'fixation.object,fixation.client,fixation.client.phones,fixation.agent',
        ...(params ? toAxiosParams(params) : {}),
    }

    const response = await ApiService.fetchDataWithAxios<
        | FixationExtendRequest[]
        | {
              data: FixationExtendRequest[]
              meta?: FixationsApiMeta
              total?: number
          }
    >({
        url: endpointConfig.fixationExtendRequests,
        method: 'get',
        params: queryParams,
    })

    let rawList: FixationExtendRequest[] = []
    let total = 0

    if (Array.isArray(response)) {
        rawList = response
        total = response.length
    } else if (response && typeof response === 'object') {
        rawList = Array.isArray(response.data) ? response.data : []
        total =
            response.meta?.total ??
            (response as { total?: number }).total ??
            rawList.length
    }

    // Сортировка: новые запросы сверху, если нет серверной сортировки
    const sortedList = [...rawList].sort((a, b) => {
        const timeA = (a.created_at || a.fixation?.created_at)
            ? new Date(a.created_at || a.fixation?.created_at || 0).getTime()
            : 0
        const timeB = (b.created_at || b.fixation?.created_at)
            ? new Date(b.created_at || b.fixation?.created_at || 0).getTime()
            : 0
        return timeB - timeA
    })

    return {
        list: sortedList,
        total,
    }
}

export async function apiApproveFixationExtendRequest(
    id: string | number,
): Promise<void> {
    await ApiService.fetchDataWithAxios({
        url: endpointConfig.fixationExtendRequestApprove(id),
        method: 'get',
    })
}

export async function apiRejectFixationExtendRequest(
    id: string | number,
): Promise<void> {
    await ApiService.fetchDataWithAxios({
        url: endpointConfig.fixationExtendRequestReject(id),
        method: 'delete',
    })
}

export type AmoStatus = {
    id: number
    name: string
    external_id?: number
    sort?: number
    color?: string
    ignore?: number
    add_fix_days?: number
    fix_status?: string | null
}

export async function apiGetAmoStatuses(): Promise<AmoStatus[]> {
    const response = await ApiService.fetchDataWithAxios<
        AmoStatus[] | { data: AmoStatus[] }
    >({
        url: endpointConfig.amoStatuses,
        method: 'get',
    })

    if (Array.isArray(response)) {
        return response
    }

    if (response && Array.isArray((response as { data?: AmoStatus[] }).data)) {
        return (response as { data: AmoStatus[] }).data
    }

    return []
}

export function formatFixedTillToDateString(
    value?: string | number | Date,
): string {
    if (!value) {
        return dayjs().add(1, 'day').format('DD.MM.YYYY')
    }
    if (value instanceof Date) {
        return dayjs(value).format('DD.MM.YYYY')
    }
    if (typeof value === 'number') {
        const days = Math.max(1, Math.round(value))
        return dayjs().add(days, 'day').format('DD.MM.YYYY')
    }
    const trimmed = String(value).trim()
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
        return trimmed
    }
    const num = parseInt(trimmed, 10)
    if (!isNaN(num) && String(num) === trimmed) {
        const days = Math.max(1, num)
        return dayjs().add(days, 'day').format('DD.MM.YYYY')
    }
    const parsed = dayjs(trimmed)
    if (parsed.isValid()) {
        return parsed.format('DD.MM.YYYY')
    }
    return dayjs().add(1, 'day').format('DD.MM.YYYY')
}

export async function apiRestoreFixation(
    fixationId: string | number,
    payload: RestoreFixationPayload = {},
): Promise<void> {
    const fixedTillString = formatFixedTillToDateString(payload.fixed_till)

    await ApiService.fetchDataWithAxios({
        url: endpointConfig.fixationRestore(fixationId),
        method: 'post',
        data: {
            amocrm_status_id: Number(payload.amocrm_status_id) || 0,
            fixed_till: fixedTillString,
        },
    })
}
