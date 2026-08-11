export type AppConfig = {
    apiPrefix: string
    authenticatedEntryPath: string
    unAuthenticatedEntryPath: string
    locale: string
    accessTokenPersistStrategy: 'localStorage' | 'sessionStorage' | 'cookies'
    /** Моки каталога и прочих разделов. Auth API не мокается. */
    enableMock: boolean
    activeNavTranslation: boolean
    defaultCountryCode: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const appConfig: AppConfig = {
    apiPrefix: trimTrailingSlash(
        import.meta.env.VITE_API_BASE_URL?.trim() || '/api',
    ),
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'en',
    accessTokenPersistStrategy: 'cookies',
    enableMock: import.meta.env.VITE_ENABLE_MOCK !== 'false',
    activeNavTranslation: false,
    defaultCountryCode: 'RU',
}

export default appConfig
