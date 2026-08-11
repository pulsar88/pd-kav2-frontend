import appConfig from '@/configs/app.config'
import cookiesStorage from '@/utils/cookiesStorage'
import {
    TOKEN_TYPE,
    REQUEST_HEADER_AUTH_KEY,
    TOKEN_NAME_IN_STORAGE,
} from '@/constants/api.constant'
import type { InternalAxiosRequestConfig } from 'axios'

const readAccessToken = () => {
    const storage = appConfig.accessTokenPersistStrategy

    if (storage === 'localStorage') {
        return localStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    }

    if (storage === 'sessionStorage') {
        return sessionStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    }

    return cookiesStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
}

const AxiosRequestIntrceptorConfigCallback = (
    config: InternalAxiosRequestConfig,
) => {
    const accessToken = readAccessToken()

    if (accessToken) {
        config.headers[REQUEST_HEADER_AUTH_KEY] = `${TOKEN_TYPE}${accessToken}`
    }

    return config
}

export default AxiosRequestIntrceptorConfigCallback
