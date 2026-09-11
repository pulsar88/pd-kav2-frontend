import AxiosBase from '@/services/axios/AxiosBase'
import endpointConfig from '@/configs/endpoint.config'
import {
    SERVER_PROBE_HEADER,
    isServerOutageStatus,
    useServerStatusStore,
} from '@/store/serverStatusStore'
import type { AxiosError } from 'axios'

/**
 * Сервер считаем «живым», если ответил чем угодно, кроме 500/502
 * (включая 401 — значит API снова доступен).
 */
export async function probeServerAvailability(): Promise<boolean> {
    useServerStatusStore.getState().setProbing(true)

    try {
        const response = await AxiosBase.get(endpointConfig.authCheck, {
            headers: {
                [SERVER_PROBE_HEADER]: '1',
            },
            validateStatus: () => true,
        })

        return !isServerOutageStatus(response.status)
    } catch (error) {
        // Сетевой обрыв / таймаут — сервер всё ещё недоступен
        const status = (error as AxiosError)?.response?.status
        if (!status) return false
        return !isServerOutageStatus(status)
    } finally {
        useServerStatusStore.getState().setProbing(false)
    }
}
