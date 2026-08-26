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
    CurrentUserResponse,
    ForgotPassword,
    ForgotPasswordResponse,
    ResetPassword,
    SendOtpCredential,
    SignInByCodeCredential,
    SignInCredential,
    SignUpAgencyCredential,
    SignUpCredential,
    UpdateUserPayload,
    User,
} from '@/@types/auth'

export const resolveProfilePictureUrl = (
    profilePicture: CurrentUserResponse['profile_picture'],
) => profilePicture?.src ?? ''

export const mapCurrentUserToUser = (
    data: CurrentUserResponse,
    previousAvatar?: string | null,
): User => ({
    userId: String(data.id),
    userName: data.name,
    email: data.email ?? '',
    phone: data.phone,
    countryCode: data.country_code,
    authority: data.roles,
    agency: typeof data.agency === 'object' ? data.agency : null,
    agencyName:
        typeof data.agency === 'string'
            ? data.agency
            : data.agency?.name || null,
    avatar:
        data.profile_picture !== undefined
            ? resolveProfilePictureUrl(data.profile_picture)
            : previousAvatar || '',
})

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

export async function apiGetCurrentUser(): Promise<User> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<CurrentUserResponse>
    >({
        url: endpointConfig.usersCurrent,
        method: 'get',
    })
    return mapCurrentUserToUser(unwrapApiData(response))
}

export async function apiUpdateUser(
    userId: string | number,
    data: UpdateUserPayload,
    previousAvatar?: string | null,
): Promise<User> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<CurrentUserResponse>
    >({
        url: endpointConfig.usersUpdate(userId),
        method: 'put',
        data,
    })
    return mapCurrentUserToUser(unwrapApiData(response), previousAvatar)
}

export async function apiUploadProfilePicture(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('profile_picture', file)

    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<CurrentUserResponse>,
        FormData
    >({
        url: endpointConfig.userProfilePicture,
        method: 'post',
        data: formData,
    })
    return mapCurrentUserToUser(unwrapApiData(response))
}

export async function apiDeleteProfilePicture(): Promise<User> {
    const response = await ApiService.fetchDataWithAxios<
        ApiDataEnvelope<CurrentUserResponse>
    >({
        url: endpointConfig.userProfilePicture,
        method: 'delete',
    })
    return mapCurrentUserToUser(unwrapApiData(response))
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
