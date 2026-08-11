import { createContext } from 'react'
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    User,
    OauthSignInCallbackPayload,
    CheckPhoneCredential,
    SendOtpCredential,
    SignInOtpCredential,
    SignUpPhoneCredential,
    SignUpAgencyPhoneCredential,
    SendOtpResult,
} from '@/@types/auth'

type CheckPhoneResult = {
    status: 'success' | 'failed' | ''
    message: string
    registered: boolean
}

type Auth = {
    authenticated: boolean
    user: User
    signIn: (values: SignInCredential) => AuthResult
    signUp: (values: SignUpCredential) => AuthResult
    signOut: () => void
    oAuthSignIn: (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => void
    checkPhone: (values: CheckPhoneCredential) => Promise<CheckPhoneResult>
    sendOtp: (values: SendOtpCredential) => SendOtpResult
    signInWithOtp: (values: SignInOtpCredential) => AuthResult
    signUpWithPhone: (
        values: SignUpPhoneCredential | SignUpAgencyPhoneCredential,
    ) => AuthResult
}

const defaultFunctionPlaceHolder = async (): AuthResult => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    return {
        status: '',
        message: '',
    }
}

const defaultSendOtpPlaceHolder = async (): SendOtpResult => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    return {
        status: '',
        message: '',
    }
}

const defaultCheckPhonePlaceHolder = async (): Promise<CheckPhoneResult> => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    return {
        status: '',
        message: '',
        registered: false,
    }
}

const defaultOAuthSignInPlaceHolder = (
    callback: (payload: OauthSignInCallbackPayload) => void,
): void => {
    callback({
        onSignIn: () => {},
        redirect: () => {},
    })
}

const AuthContext = createContext<Auth>({
    authenticated: false,
    user: {},
    signIn: async () => defaultFunctionPlaceHolder(),
    signUp: async () => defaultFunctionPlaceHolder(),
    signOut: () => {},
    oAuthSignIn: defaultOAuthSignInPlaceHolder,
    checkPhone: defaultCheckPhonePlaceHolder,
    sendOtp: async () => defaultSendOtpPlaceHolder(),
    signInWithOtp: async () => defaultFunctionPlaceHolder(),
    signUpWithPhone: async () => defaultFunctionPlaceHolder(),
})

export default AuthContext
