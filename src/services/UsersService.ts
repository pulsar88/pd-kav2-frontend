import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import { toAxiosParams } from '@/views/objects/realtyPropertyQuery'
import type {
    AdminUserListItem,
    ChangeUserAgencyPayload,
    GetUsersParams,
    GetUsersResponse,
} from '@/@types/users'
import { unwrapApiData, type ApiDataEnvelope } from './auth/authUtils'

const DEFAULT_PER_PAGE = 20
const USERS_LIST_WITH = 'agency,profilePicture'

export async function apiGetUsers(
    params: GetUsersParams = {},
): Promise<GetUsersResponse> {
    const page = Math.max(1, params.page ?? 1)
    const perPage = Math.max(1, params.per_page ?? DEFAULT_PER_PAGE)
    const search = params.search?.trim() || undefined

    const response = await ApiService.fetchDataWithAxios<
        GetUsersResponse | AdminUserListItem[]
    >({
        url: endpointConfig.users,
        method: 'get',
        params: toAxiosParams({
            page,
            per_page: perPage,
            with: params.with ?? USERS_LIST_WITH,
            ...(search ? { search } : {}),
        }),
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

    const data = Array.isArray(response?.data) ? response.data : []
    const meta = response?.meta ?? {
        current_page: page,
        last_page: 1,
        per_page: perPage,
        total: data.length,
    }

    return { data, meta }
}

export async function apiChangeUserAgency(
    userId: string | number,
    payload: ChangeUserAgencyPayload,
): Promise<AdminUserListItem> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AdminUserListItem> | AdminUserListItem
    >({
        url: endpointConfig.userChangeAgency(userId),
        method: 'post',
        data: payload,
    })
    return unwrapApiData(response)
}

/** Назначить пользователя руководителем его агентства */
export async function apiMakeUserAgencySupervisor(
    userId: string | number,
): Promise<AdminUserListItem | void> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AdminUserListItem> | AdminUserListItem | null | undefined
    >({
        url: endpointConfig.userMakeSupervisor(userId),
        method: 'get',
    })

    if (response == null) return

    return unwrapApiData(response)
}
