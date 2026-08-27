export type AuthCountryCode = string

export type AuthPhonePayload = {
    phone: string
    country_code: AuthCountryCode
}

export type AuthEnumValue = {
    value: string
    code: string
    name: string
}

export type AuthSendCodeResponse = {
    purpose: AuthEnumValue
    unique_part: string
    channel: AuthEnumValue
    expires_at: string
    id: number
    code: string
    created_at: string
    updated_at: string
}

export type AuthTokenResponse = {
    token: string
}

export type AuthRegisteredResponse = {
    registered: boolean
}

export type AuthStatusResponse = {
    status: boolean
}

export type AuthMessageResponse = {
    message: string
}

export type SignInCredential = AuthPhonePayload & {
    password: string
}

export type SignInByCodeCredential = AuthPhonePayload & {
    code: string
    unique_part: string
}

export type SignUpCredential = AuthPhonePayload & {
    name: string
    password: string
    code: string
    unique_part: string
}

export type SignUpAgencyCredential = SignUpCredential & {
    agency: AuthPhonePayload & {
        name: string
    }
}

export type CheckPhoneCredential = AuthPhonePayload

export type CheckPhoneResponse = AuthRegisteredResponse

export type SendOtpCredential = AuthPhonePayload & {
    purpose: 'login' | 'register'
}

export type SignInOtpCredential = SignInByCodeCredential

export type SignUpPhoneCredential = SignUpCredential

export type SignUpAgencyPhoneCredential = SignUpAgencyCredential

export type ForgotPassword = {
    email: string
    channel: 'SMS' | 'EMAIL' | string
}

export type ForgotPasswordResponse = {
    message: string
    /** Некоторые бэкенды отдают unique_part для следующего шага */
    unique_part?: string
    data?: {
        unique_part?: string
        message?: string
    }
}

export type ResetPassword = {
    password: string
    password_confirmation: string
    unique_part: string
    code: string
}

export type ChangePassword = {
    old_password: string
    password: string
    password_confirmation: string
}

/** @deprecated legacy shape kept for Oauth helpers */
export type SignInResponse = {
    token: string
    user?: User
}

export type SignUpResponse = SignInResponse

export type AuthRequestStatus = 'success' | 'failed' | ''

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
}>

export type SendOtpResult = Promise<{
    status: AuthRequestStatus
    message: string
    uniquePart?: string
}>

export type User = {
    userId?: string | null
    avatar?: string | null
    userName?: string | null
    email?: string | null
    phone?: string | null
    countryCode?: string | null
    authority?: string[]
    agency?: AgencyBrief | null
    agencyName?: string | null
}

export type ProfilePicture = {
    id: number
    uuid: string
    name: string
    file_name: string
    mime_type: string
    size: number
    src: string
    upload_date: string
    responsive: unknown[]
    base_url: string
    responsive_path: string
    url_path: string
}

export type AgencyBrief = {
    id: number
    fix_days: number
    name: string
}

export type CurrentUserResponse = {
    id: number
    name: string
    email: string | null
    phone: string
    country_code: string
    roles: string[]
    profile_picture: ProfilePicture | null
    agency?: AgencyBrief | null
}

export type UpdateUserPayload = {
    id: number
    name: string
    email: string
    phone: string
    country_code: string
}

export type Token = {
    accessToken: string
    refereshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
