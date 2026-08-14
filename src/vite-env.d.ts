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
    readonly VITE_FIREBASE_API_KEY: string
    readonly VITE_FIREBASE_AUTH_DOMAIN: string
    readonly VITE_FIREBASE_DATABASE_URL: string
    readonly VITE_FIREBASE_PROJECT_ID: string
    readonly VITE_FIREBASE_STORAGE_BUCKET: string
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
    readonly VITE_FIREBASE_APP_ID: string
    readonly VITE_FIREBASE_MEASUREMENT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
