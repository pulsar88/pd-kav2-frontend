import { create } from 'zustand'

export type ServerOutageStatus = 500 | 502

type ServerStatusState = {
    isUnavailable: boolean
    statusCode: ServerOutageStatus | null
    /** Запросы с этим заголовком не открывают заглушку повторно */
    probing: boolean
}

type ServerStatusAction = {
    reportServerOutage: (statusCode?: number | null) => void
    setProbing: (probing: boolean) => void
    clearServerOutage: () => void
}

export const SERVER_PROBE_HEADER = 'X-Server-Probe'

export const isServerOutageStatus = (
    status: number | undefined,
): status is ServerOutageStatus => status === 500 || status === 502

export const useServerStatusStore = create<
    ServerStatusState & ServerStatusAction
>((set, get) => ({
    isUnavailable: false,
    statusCode: null,
    probing: false,
    reportServerOutage: (statusCode) => {
        if (
            statusCode != null &&
            statusCode !== undefined &&
            !isServerOutageStatus(statusCode)
        ) {
            return
        }

        const nextCode = isServerOutageStatus(statusCode ?? undefined)
            ? statusCode
            : null

        if (get().isUnavailable && get().statusCode === nextCode) return
        set({ isUnavailable: true, statusCode: nextCode })
    },
    setProbing: (probing) => set({ probing }),
    clearServerOutage: () =>
        set({ isUnavailable: false, statusCode: null, probing: false }),
}))
