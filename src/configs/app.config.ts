export type AppConfig = {
    apiPrefix: string
    authenticatedEntryPath: string
    unAuthenticatedEntryPath: string
    locale: string
    accessTokenPersistStrategy: 'localStorage' | 'sessionStorage' | 'cookies'
    defaultCountryCode: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const appConfig: AppConfig = {
    apiPrefix: trimTrailingSlash(
        import.meta.env.VITE_API_BASE_URL?.trim() || '/api',
    ),
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'ru',
    accessTokenPersistStrategy: 'cookies',
    defaultCountryCode: 'RU',
}

export default appConfig
