import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import broadcastConfig from '@/configs/broadcast.config'
import appConfig from '@/configs/app.config'
import { TOKEN_NAME_IN_STORAGE, TOKEN_TYPE } from '@/constants/api.constant'
import cookiesStorage from '@/utils/cookiesStorage'
import { resolveEchoConnectionOptions } from './resolveEchoOptions'

declare global {
    interface Window {
        Pusher: typeof Pusher
        Echo?: Echo
    }
}

let echoInstance: Echo | null = null

const readAccessToken = () => {
    const storage = appConfig.accessTokenPersistStrategy

    if (storage === 'localStorage') {
        return localStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    }

    if (storage === 'sessionStorage') {
        return sessionStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    }

    return cookiesStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
}

export const getEcho = () => {
    if (!broadcastConfig.enabled) {
        console.warn('[WebSocket] Broadcasting is disabled: missing VITE_WS_APP_KEY')
        throw new Error('Broadcasting is disabled: missing VITE_WS_APP_KEY')
    }

    if (!echoInstance) {
        window.Pusher = Pusher

        const connection = resolveEchoConnectionOptions()

        console.log('[WebSocket] Connecting...', {
            key: broadcastConfig.key,
            wsHost: connection.wsHost,
            wsPath: broadcastConfig.wsPath,
            wsPort: connection.wsPort,
            wssPort: connection.wssPort,
            forceTLS: connection.forceTLS,
            authEndpoint: connection.authEndpoint,
        })

        echoInstance = new Echo({
            broadcaster: 'pusher',
            key: broadcastConfig.key,
            wsHost: connection.wsHost,
            wsPath: broadcastConfig.wsPath,
            wsPort: connection.wsPort,
            wssPort: connection.wssPort,
            forceTLS: connection.forceTLS,
            disableStats: true,
            enabledTransports: ['ws', 'wss'],
            cluster: 'mt1',
            authEndpoint: connection.authEndpoint,
            auth: {
                headers: {
                    Authorization: `${TOKEN_TYPE}${readAccessToken()}`,
                },
            },
        })

        const pusher = (echoInstance as unknown as { connector?: { pusher?: Pusher } }).connector?.pusher
        if (pusher?.connection) {
            pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
                console.log(`[WebSocket] State changed: ${states.previous} -> ${states.current}`)
            })
            pusher.connection.bind('connected', () => {
                console.log('[WebSocket] Connected! Socket ID:', echoInstance?.socketId())
            })
            pusher.connection.bind('disconnected', () => {
                console.log('[WebSocket] Disconnected')
            })
            pusher.connection.bind('error', (err: unknown) => {
                console.error('[WebSocket] Error:', err)
            })
            pusher.connection.bind('unavailable', () => {
                console.warn('[WebSocket] Unavailable (offline)')
            })
        }

        window.Echo = echoInstance
    }

    return echoInstance
}

export const disconnectEcho = () => {
    if (echoInstance) {
        console.log('[WebSocket] Disconnecting...')
        echoInstance.disconnect()
        echoInstance = null
        delete window.Echo
    }
}
