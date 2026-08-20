import broadcastConfig from '@/configs/broadcast.config'

const resolveDevPort = () => {
    if (typeof window === 'undefined') {
        return 5173
    }

    const port = Number(window.location.port)

    return Number.isFinite(port) && port > 0 ? port : 5173
}

export const resolveEchoConnectionOptions = () => {
    if (!import.meta.env.DEV) {
        return {
            authEndpoint: broadcastConfig.authEndpoint,
            wsHost: broadcastConfig.wsHost,
            wsPort: broadcastConfig.wssPort,
            wssPort: broadcastConfig.wssPort,
            forceTLS: broadcastConfig.forceTLS,
        }
    }

    const useTls = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const devPort = resolveDevPort()

    return {
        authEndpoint: '/broadcasting/auth',
        wsHost: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        wsPort: devPort,
        wssPort: devPort,
        forceTLS: useTls,
    }
}
