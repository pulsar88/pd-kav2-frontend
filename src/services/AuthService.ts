import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import {
    unwrapApiData,
    type ApiDataEnvelope,
} from './auth/authUtils'
import type {
    AuthMessageResponse,
    AuthRegisteredResponse,
    AuthSendCodeResponse,
    AuthStatusResponse,
    AuthTokenResponse,
    CheckPhoneCredential,
    ForgotPassword,
    ForgotPasswordResponse,
    ResetPassword,
    SendOtpCredential,
    SignInByCodeCredential,
    SignInCredential,
    SignUpAgencyCredential,
    SignUpCredential,
} from '@/@types/auth'

export async function apiRegisterSendCode(data: CheckPhoneCredential) {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AuthSendCodeResponse>
    >({
        url: endpointConfig.authRegisterSendCode,
        method: 'post',
        data,
    })
    return unwrapApiData(response)
}

export async function apiLoginSendCode(data: CheckPhoneCredential) {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AuthSendCodeResponse>
    >({
        url: endpointConfig.authLoginSendCode,
        method: 'post',
        data,
    })
    return unwrapApiData(response)
}

export async function apiSignIn(data: SignInCredential) {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AuthTokenResponse>
    >({
        url: endpointConfig.authLogin,
        method: 'post',
        data,
    })
    return unwrapApiData(response)
}

export async function apiSignInByCode(data: SignInByCodeCredential) {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AuthTokenResponse>
    >({
        url: endpointConfig.authLoginByCode,
        method: 'post',
        data,
    })
    return unwrapApiData(response)
}

export async function apiRegister(data: SignUpCredential) {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AuthTokenResponse>
    >({
        url: endpointConfig.authRegister,
        method: 'post',
        data,
    })
    return unwrapApiData(response)
}

export async function apiRegisterAgency(data: SignUpAgencyCredential) {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AuthTokenResponse>
    >({
        url: endpointConfig.authRegisterAgency,
        method: 'post',
        data,
    })
    return unwrapApiData(response)
}

export async function apiSignOut() {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.authLogout,
        method: 'post',
        validateStatus: (status) => status === 204 || status === 200,
    })
}

export async function apiCheckPhone(data: CheckPhoneCredential) {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AuthRegisteredResponse>
    >({
        url: endpointConfig.authRegisterCheck,
        method: 'post',
        data,
    })
    return unwrapApiData(response)
}

export async function apiAuthCheck() {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<AuthStatusResponse>
    >({
        url: endpointConfig.authCheck,
        method: 'get',
    })
    return unwrapApiData(response)
}

export async function apiSendOtp(data: SendOtpCredential) {
    if (data.purpose === 'register') {
        return apiRegisterSendCode(data)
    }
    return apiLoginSendCode(data)
}

export async function apiSignInOtp(data: SignInByCodeCredential) {
    return apiSignInByCode(data)
}

export async function apiSignUp(data: SignUpCredential) {
    return apiRegister(data)
}

export async function apiForgotPassword(data: ForgotPassword) {
    return ApiService.fetchDataWithAxios<ForgotPasswordResponse>({
        url: endpointConfig.authForgotPassword,
        method: 'post',
        data,
    })
}

export async function apiResetPassword(data: ResetPassword) {
    return ApiService.fetchDataWithAxios<AuthMessageResponse>({
        url: endpointConfig.authResetPassword,
        method: 'post',
        data,
    })
}
