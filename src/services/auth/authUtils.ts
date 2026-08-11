import appConfig from '@/configs/app.config'
import { normalizeRuPhoneDigits } from '@/views/fixations/utils'
import type { AuthPhonePayload } from '@/@types/auth'

/** Телефон для API: 10 цифр без кода страны + country_code */
export const toAuthPhonePayload = (
    phoneInput: string,
    countryCode = appConfig.defaultCountryCode,
): AuthPhonePayload => ({
    phone: normalizeRuPhoneDigits(phoneInput),
    country_code: countryCode,
})

export type ApiDataEnvelope<T> = {
    data: T
}

export const unwrapApiData = <T>(payload: ApiDataEnvelope<T> | T): T => {
    if (
        payload &&
        typeof payload === 'object' &&
        'data' in payload &&
        (payload as ApiDataEnvelope<T>).data !== undefined
    ) {
        return (payload as ApiDataEnvelope<T>).data
    }
    return payload as T
}

export const getApiErrorMessage = (errors: unknown, fallback = 'Произошла ошибка') => {
    const err = errors as {
        response?: {
            data?: {
                message?: string
                error?: string
                errors?: Record<string, string[] | string>
            }
        }
        message?: string
    }

    const data = err?.response?.data
    if (data?.message) return data.message
    if (data?.error) return data.error

    if (data?.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors)[0]
        if (Array.isArray(first) && first[0]) return first[0]
        if (typeof first === 'string') return first
    }

    if (err?.message) return err.message
    return fallback
}
