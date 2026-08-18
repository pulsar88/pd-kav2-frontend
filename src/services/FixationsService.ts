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
    FixationManager,
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

const delay = (ms = 200) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms)
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

export async function apiGetFixationManagers(): Promise<FixationManager[]> {
    const response =
        await ApiService.fetchDataWithAxios<FixationCreateManagersApiResponse>(
            {
                url: endpointConfig.managers,
                method: 'get',
            },
        )

    return response.data.map(mapFixationCreateManagerApiToManager)
}

const mapComplexToFixationComplex = (item: Complex): FixationComplex => ({
    id: item.id,
    name: item.name,
    address: item.address?.trim() || '',
    apartments: [],
    managers: [],
})

export async function apiGetFixationHouses(): Promise<FixationComplex[]> {
    const response = await apiGetRealtyPropertiesSummary({
        per_page: 1000,
    })

    return response.items.map(mapComplexToFixationComplex)
}

export async function apiCreateFixation(
    data: CreateFixationWizardPayload,
): Promise<void> {
    await ApiService.fetchDataWithAxios({
        url: endpointConfig.fixations,
        method: 'post',
        data: mapCreateFixationPayloadToApiBody(data),
    })
}

// TODO(api): отдельный POST клиента — если появится endpoint, можно вернуть
// export async function apiCreateFixationClient(data: CreateFixationClientPayload) { ... }
