import * as Sentry from '@sentry/react'
import {
    SERVER_PROBE_HEADER,
    isServerOutageStatus,
    useServerStatusStore,
} from '@/store/serverStatusStore'
import { useSessionUser, useToken } from '@/store/authStore'
import { useUserBlockedStore } from '@/store/userBlockedStore'
import type { AxiosError } from 'axios'

const unauthorizedCode = [401, 419, 440]

const reportApi400ToSentry = (error: AxiosError) => {
    const { response, config } = error
    if (!response || response.status !== 400) return

    Sentry.captureException(
        new Error(`API Error 400: ${config?.url ?? 'unknown'}`),
        {
            extra: {
                responseData: response.data,
                requestPayload: config?.data,
            },
        },
    )
}

const AxiosResponseIntrceptorErrorCallback = (error: AxiosError) => {
    const { response, config } = error
    const { setToken } = useToken()

    const isProbe = Boolean(
        config?.headers?.[SERVER_PROBE_HEADER] ??
            config?.headers?.common?.[SERVER_PROBE_HEADER],
    )

    const responseData = response?.data as
        | { code?: string; message?: string }
        | undefined
    if (
        response?.status === 403 &&
        (responseData?.code === 'user_blocked' ||
            responseData?.message?.toLowerCase().includes('приостановлен'))
    ) {
        setToken('')
        useSessionUser.getState().setUser({})
        useSessionUser.getState().setSessionSignedIn(false)
        useUserBlockedStore.getState().setBlocked(true, responseData?.message)
        return
    }

    if (response && isServerOutageStatus(response.status) && !isProbe) {
        useServerStatusStore
            .getState()
            .reportServerOutage(response.status, responseData?.message)
    }

    if (!isProbe) {
        reportApi400ToSentry(error)
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
