import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'

export type PushSubscribePayload = {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

export type PushUnsubscribePayload = {
    endpoint: string
}

type PushApiResponse = {
    success?: boolean
    message?: string
}

export async function apiPushSubscribe(data: PushSubscribePayload) {
    return ApiService.fetchDataWithAxios<PushApiResponse, PushSubscribePayload>({
        url: endpointConfig.pushSubscribe,
        method: 'post',
        data,
    })
}

export async function apiPushUnsubscribe(data: PushUnsubscribePayload) {
    return ApiService.fetchDataWithAxios<
        PushApiResponse,
        PushUnsubscribePayload
    >({
        url: endpointConfig.pushUnsubscribe,
        method: 'post',
        data,
    })
}
