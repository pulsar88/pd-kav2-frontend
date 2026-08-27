import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    AgencyItem,
    AgencyRequestsApiResponse,
    CreateJoinAgencyRequestPayload,
    GetAgenciesParams,
    GetAgenciesResponse,
    GetAgencyRequestsParams,
    JoinAgencyRequest,
} from '@/@types/agency'

type ApiDataEnvelope<T> = {
    data: T
}

const DEFAULT_AGENCIES_PER_PAGE = 20

export async function apiGetAgencies(
    params: GetAgenciesParams = {},
): Promise<GetAgenciesResponse> {
    const page = Math.max(1, params.page ?? 1)
    const perPage = Math.max(1, params.per_page ?? DEFAULT_AGENCIES_PER_PAGE)
    const search = params.search?.trim() || undefined

    const response = await ApiService.fetchDataWithAxios<
        GetAgenciesResponse | AgencyItem[]
    >({
        url: endpointConfig.agencies,
        method: 'get',
        params: {
            page,
            per_page: perPage,
            ...(search ? { search } : {}),
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

    const data = response.data ?? []
    const meta = response.meta ?? {
        current_page: page,
        last_page: 1,
        per_page: perPage,
        total: data.length,
    }

    return { data, meta }
}

/**
 * 1. Получить список запросов на присоединение
 * (с авто-фильтром: для агента — его заявки, для руководителя — заявки в его агентство)
 */
export async function apiGetAgencyRequests(
    params: GetAgencyRequestsParams = {},
): Promise<AgencyRequestsApiResponse> {
    return ApiService.fetchDataWithAxios<AgencyRequestsApiResponse>({
        url: endpointConfig.agencyRequests,
        method: 'get',
        params: {
            with: 'agent',
            sort_by: 'created_at',
            order: 'desc',
            ...params,
        },
    })
}

/**
 * Последняя заявка пользователя (первая в списке при order=desc).
 */
export async function apiGetLatestAgencyRequest(): Promise<JoinAgencyRequest | null> {
    const response = await apiGetAgencyRequests({
        page: 1,
        per_page: 1,
        with: 'agency',
    })

    return response.data?.[0] ?? null
}

/**
 * 2. Создать заявку на присоединение к агентству
 */
export async function apiCreateAgencyRequest(
    data: CreateJoinAgencyRequestPayload,
): Promise<JoinAgencyRequest> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<JoinAgencyRequest> | JoinAgencyRequest
    >({
        url: endpointConfig.agencyRequests,
        method: 'post',
        data,
    })

    return 'data' in response ? response.data : response
}

/**
 * 3. Получить конкретную заявку по ID
 */
export async function apiGetAgencyRequest(
    requestId: string | number,
): Promise<JoinAgencyRequest> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<JoinAgencyRequest> | JoinAgencyRequest
    >({
        url: endpointConfig.agencyRequest(requestId),
        method: 'get',
    })

    return 'data' in response ? response.data : response
}

/**
 * 4. Одобрить заявку (доступно руководителю)
 */
export async function apiApproveAgencyRequest(
    requestId: string | number,
): Promise<JoinAgencyRequest> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<JoinAgencyRequest> | JoinAgencyRequest
    >({
        url: endpointConfig.agencyRequestApprove(requestId),
        method: 'get',
    })

    return 'data' in response ? response.data : response
}

/**
 * 5. Отклонить заявку (доступно руководителю)
 */
export async function apiRejectAgencyRequest(
    requestId: string | number,
): Promise<JoinAgencyRequest> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<JoinAgencyRequest> | JoinAgencyRequest
    >({
        url: endpointConfig.agencyRequestReject(requestId),
        method: 'get',
    })

    return 'data' in response ? response.data : response
}

/**
 * 6. Отменить заявку (доступно агенту)
 */
export async function apiCancelAgencyRequest(
    requestId: string | number,
): Promise<JoinAgencyRequest> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<JoinAgencyRequest> | JoinAgencyRequest
    >({
        url: endpointConfig.agencyRequestCancel(requestId),
        method: 'get',
    })

    return 'data' in response ? response.data : response
}