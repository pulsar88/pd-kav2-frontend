import { create } from 'zustand'

export type ServerOutageStatus = 500 | 502

type ServerStatusState = {
    isUnavailable: boolean
    statusCode: number | null
    errorMessage: string | null
    /** Запросы с этим заголовком не открывают заглушку повторно */
    probing: boolean
}

type ServerStatusAction = {
    reportServerOutage: (statusCode?: number | null, errorMessage?: string | null) => void
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
    errorMessage: null,
    probing: false,
    reportServerOutage: (statusCode, errorMessage) => {
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
        const nextMessage = errorMessage || null

        if (
            get().isUnavailable &&
            get().statusCode === nextCode &&
            get().errorMessage === nextMessage
        ) {
            return
        }

        set({
            isUnavailable: true,
            statusCode: nextCode,
            errorMessage: nextMessage,
        })
    },
    setProbing: (probing) => set({ probing }),
    clearServerOutage: () =>
        set({
            isUnavailable: false,
            statusCode: null,
            errorMessage: null,
            probing: false,
        }),
}))
