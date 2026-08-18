import { useEffect, useRef, useImperativeHandle, useState } from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { useSessionUser, useToken } from '@/store/authStore'
import {
    apiAuthCheck,
    apiCheckPhone,
    apiGetCurrentUser,
    apiRegister,
    apiRegisterAgency,
    apiSendOtp,
    apiSignIn,
    apiSignInByCode,
    apiSignOut,
} from '@/services/AuthService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { disconnectEcho } from '@/services/broadcast/echo'
import { clearFavoritesStore } from '@/store/favoritesStore'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router'
import PushSubscriptionPrompt from '@/components/shared/PushSubscriptionPrompt'
import { preparePushPromptAfterAuth } from '@/utils/webPush'
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    OauthSignInCallbackPayload,
    User,
    Token,
    CheckPhoneCredential,
    SignInOtpCredential,
    SignUpPhoneCredential,
    SignUpAgencyPhoneCredential,
    SendOtpCredential,
    SendOtpResult,
} from '@/@types/auth'
import type { ReactNode, Ref } from 'react'
import type { NavigateFunction } from 'react-router'

type AuthProviderProps = { children: ReactNode }

export type IsolatedNavigatorRef = {
    navigate: NavigateFunction
}

const IsolatedNavigator = ({ ref }: { ref: Ref<IsolatedNavigatorRef> }) => {
    const navigate = useNavigate()

    useImperativeHandle(ref, () => {
        return {
            navigate,
        }
    }, [navigate])

    return <></>
}

function AuthProvider({ children }: AuthProviderProps) {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const setSessionSignedIn = useSessionUser(
        (state) => state.setSessionSignedIn,
    )
    const { token, setToken } = useToken()
    const [tokenState, setTokenState] = useState(token)
    const [pushPromptOpen, setPushPromptOpen] = useState(false)

    const authenticated = Boolean(tokenState && signedIn)

    const navigatorRef = useRef<IsolatedNavigatorRef>(null)

    const redirect = () => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)

        navigatorRef.current?.navigate(
            redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath,
        )
    }

    const handleSignIn = (tokens: Token, nextUser?: User) => {
        setToken(tokens.accessToken)
        setTokenState(tokens.accessToken)
        setSessionSignedIn(true)

        if (nextUser) {
            setUser(nextUser)
        }
    }

    const handleSignOut = () => {
        disconnectEcho()
        clearFavoritesStore()
        setToken('')
        setTokenState('')
        setUser({})
        setSessionSignedIn(false)
    }

    const loadCurrentUser = async () => {
        try {
            const currentUser = await apiGetCurrentUser()
            setUser(currentUser)
        } catch {
            // оставляем данные из fallback / persist
        }
    }

    useEffect(() => {
        let cancelled = false

        const verifySession = async () => {
            if (!token) {
                if (signedIn) {
                    handleSignOut()
                }
                return
            }

            try {
                const resp = await apiAuthCheck()
                if (cancelled) return

                if (!resp?.status) {
                    handleSignOut()
                    return
                }

                setTokenState(token)
                setSessionSignedIn(true)
                await loadCurrentUser()
            } catch {
                if (!cancelled) {
                    handleSignOut()
                }
            }
        }

        void verifySession()

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
    }, [])

    const finishAuth = async (accessToken: string, nextUser?: User) => {
        handleSignIn({ accessToken }, nextUser)
        await loadCurrentUser()
        redirect()

        void preparePushPromptAfterAuth()
            .then(({ shouldPrompt }) => {
                if (shouldPrompt) {
                    // Даём завершиться редиректу, затем спрашиваем
                    window.setTimeout(() => setPushPromptOpen(true), 500)
                }
            })
            .catch((error) => {
                console.error('Push prompt prepare failed', error)
            })

        return {
            status: 'success' as const,
            message: '',
        }
    }

    const signIn = async (values: SignInCredential): AuthResult => {
        try {
            const resp = await apiSignIn(values)
            if (resp?.token) {
                return await finishAuth(resp.token, {
                    phone: values.phone,
                    userName: user.userName || '',
                })
            }
            return {
                status: 'failed',
                message: 'Не удалось войти',
            }
        } catch (errors: unknown) {
            return {
                status: 'failed',
                message: getApiErrorMessage(errors, 'Не удалось войти'),
            }
        }
    }

    const signUp = async (values: SignUpCredential): AuthResult => {
        try {
            const resp = await apiRegister(values)
            if (resp?.token) {
                return await finishAuth(resp.token, {
                    userName: values.name,
                    phone: values.phone,
                })
            }
            return {
                status: 'failed',
                message: 'Не удалось зарегистрироваться',
            }
        } catch (errors: unknown) {
            return {
                status: 'failed',
                message: getApiErrorMessage(
                    errors,
                    'Не удалось зарегистрироваться',
                ),
            }
        }
    }

    const checkPhone = async (values: CheckPhoneCredential) => {
        try {
            const resp = await apiCheckPhone(values)
            return {
                status: 'success' as const,
                message: '',
                registered: Boolean(resp?.registered),
            }
        } catch (errors: unknown) {
            return {
                status: 'failed' as const,
                message: getApiErrorMessage(errors),
                registered: false,
            }
        }
    }

    const sendOtp = async (values: SendOtpCredential): SendOtpResult => {
        try {
            const resp = await apiSendOtp(values)
            return {
                status: 'success',
                message: '',
                uniquePart: resp?.unique_part,
            }
        } catch (errors: unknown) {
            return {
                status: 'failed',
                message: getApiErrorMessage(errors, 'Не удалось отправить код'),
            }
        }
    }

    const signInWithOtp = async (values: SignInOtpCredential): AuthResult => {
        try {
            const resp = await apiSignInByCode(values)
            if (resp?.token) {
                return await finishAuth(resp.token, {
                    phone: values.phone,
                })
            }
            return {
                status: 'failed',
                message: 'Не удалось войти',
            }
        } catch (errors: unknown) {
            return {
                status: 'failed',
                message: getApiErrorMessage(errors, 'Не удалось войти'),
            }
        }
    }

    const signUpWithPhone = async (
        values: SignUpPhoneCredential | SignUpAgencyPhoneCredential,
    ): AuthResult => {
        try {
            const isAgency = 'agency' in values && Boolean(values.agency)
            const resp = isAgency
                ? await apiRegisterAgency(values as SignUpAgencyPhoneCredential)
                : await apiRegister(values)

            if (resp?.token) {
                return await finishAuth(resp.token, {
                    userName: values.name,
                    phone: values.phone,
                })
            }
            return {
                status: 'failed',
                message: 'Не удалось зарегистрироваться',
            }
        } catch (errors: unknown) {
            return {
                status: 'failed',
                message: getApiErrorMessage(
                    errors,
                    'Не удалось зарегистрироваться',
                ),
            }
        }
    }

    const signOut = async () => {
        try {
            await apiSignOut()
        } finally {
            handleSignOut()
            navigatorRef.current?.navigate('/')
        }
    }

    const oAuthSignIn = (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => {
        callback({
            onSignIn: handleSignIn,
            redirect,
        })
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                signIn,
                signUp,
                signOut,
                oAuthSignIn,
                checkPhone,
                sendOtp,
                signInWithOtp,
                signUpWithPhone,
            }}
        >
            {children}
            <IsolatedNavigator ref={navigatorRef} />
            <PushSubscriptionPrompt
                isOpen={pushPromptOpen}
                onClose={() => setPushPromptOpen(false)}
            />
        </AuthContext.Provider>
    )
}

export default AuthProvider
