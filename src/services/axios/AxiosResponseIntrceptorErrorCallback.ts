import { useSessionUser, useToken } from '@/store/authStore'
import type { AxiosError } from 'axios'

const unauthorizedCode = [401, 419, 440]

const AxiosResponseIntrceptorErrorCallback = (error: AxiosError) => {
    const { response, config } = error
    const { setToken } = useToken()

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
