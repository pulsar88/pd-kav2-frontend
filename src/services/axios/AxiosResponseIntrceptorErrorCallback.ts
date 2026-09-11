import {
    SERVER_PROBE_HEADER,
    isServerOutageStatus,
    useServerStatusStore,
} from '@/store/serverStatusStore'
import { useSessionUser, useToken } from '@/store/authStore'
import type { AxiosError } from 'axios'

const unauthorizedCode = [401, 419, 440]

const AxiosResponseIntrceptorErrorCallback = (error: AxiosError) => {
    const { response, config } = error
    const { setToken } = useToken()

    const isProbe = Boolean(
        config?.headers?.[SERVER_PROBE_HEADER] ??
            config?.headers?.common?.[SERVER_PROBE_HEADER],
    )

    if (response && isServerOutageStatus(response.status) && !isProbe) {
        useServerStatusStore.getState().reportServerOutage(response.status)
    }

    if (response && unauthorizedCode.includes(response.status)) {
        const url = String(config?.url || '')
        const isCredentialAuthAttempt =
            /\/v2\/auth\/(login|login_by_code|register)(\/|$)/.test(url)

        if (isCredentialAuthAttempt) {
            return
        }

        setToken('')
        useSessionUser.getState().setUser({})
        useSessionUser.getState().setSessionSignedIn(false)
    }
}

export default AxiosResponseIntrceptorErrorCallback
