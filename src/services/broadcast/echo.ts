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
        throw new Error('Broadcasting is disabled: missing VITE_WS_APP_KEY')
    }

    if (!echoInstance) {
        window.Pusher = Pusher

        const connection = resolveEchoConnectionOptions()

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

        window.Echo = echoInstance
    }

    return echoInstance
}

export const disconnectEcho = () => {
    if (echoInstance) {
        echoInstance.disconnect()
        echoInstance = null
        delete window.Echo
    }
}
