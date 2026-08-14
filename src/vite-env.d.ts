/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_ENABLE_MOCK: string
    readonly VITE_WS_APP_KEY: string
    readonly VITE_PUSHER_HOST: string
    readonly VITE_PUSHER_PATH: string
    readonly VITE_PUSHER_PORT: string
    readonly VITE_PUSHER_FORCE_TLS: string
    readonly VITE_BROADCAST_AUTH_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
