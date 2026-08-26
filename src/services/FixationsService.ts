import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import { getFixationsDashboardStats } from '@/views/fixations/fixationsDashboardMockData'
import type { FixationsDashboardStats } from '@/views/fixations/dashboard.constants'
import type { Complex } from '@/views/objects/types'
import { apiGetRealtyPropertiesSummary } from '@/services/ObjectsService'
import type {
    CreateFixationWizardPayload,
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
    FixationsApiResponse,
    GetFixationsParams,
} from '@/views/fixations/fixationApi.types'
import type { Fixation, GetFixationsResponse } from '@/views/fixations/types'
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

// TODO(api): отдельный POST клиента — если появится endpoint, можно вернуть
// export async function apiCreateFixationClient(data: CreateFixationClientPayload) { ... }
