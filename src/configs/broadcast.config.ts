const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const resolveApiOrigin = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL?.trim()

    if (!apiBase) {
        return window.location.origin
    }

    try {
        return new URL(apiBase, window.location.origin).origin
    } catch {
        return window.location.origin
    }
}

const resolveWsHost = () => {
    const host = import.meta.env.VITE_PUSHER_HOST?.trim()

    if (host) {
        return host
    }

    try {
        return new URL(resolveApiOrigin()).hostname
    } catch {
        return window.location.hostname
    }
}

const broadcastConfig = {
    key: import.meta.env.VITE_WS_APP_KEY?.trim() ?? '',
    wsHost: resolveWsHost(),
    wsPath: trimTrailingSlash(
        import.meta.env.VITE_PUSHER_PATH?.trim() || '/soketi',
    ),
    wssPort: Number(import.meta.env.VITE_PUSHER_PORT ?? 443),
    forceTLS: import.meta.env.VITE_PUSHER_FORCE_TLS !== 'false',
    authEndpoint:
        import.meta.env.VITE_BROADCAST_AUTH_URL?.trim() ||
        `${resolveApiOrigin()}/broadcasting/auth`,
    enabled: Boolean(import.meta.env.VITE_WS_APP_KEY?.trim()),
}

export default broadcastConfig
