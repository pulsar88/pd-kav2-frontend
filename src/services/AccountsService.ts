import ApiService from './ApiService'

export async function apiGetSettingsProfile<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/setting/profile',
        method: 'get',
    })
}

export async function apiUpdateSettingsProfile<T, U extends Record<string, unknown>>(
    data: U,
) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/setting/profile',
        method: 'put',
        data,
    })
}
