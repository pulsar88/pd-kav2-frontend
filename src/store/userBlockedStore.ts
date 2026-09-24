import { create } from 'zustand'

type UserBlockedState = {
    isBlocked: boolean
    blockedMessage: string
    setBlocked: (blocked: boolean, message?: string) => void
    clearBlocked: () => void
}

export const useUserBlockedStore = create<UserBlockedState>((set) => ({
    isBlocked: false,
    blockedMessage: 'Действие учётной записи приостановлено',
    setBlocked: (blocked, message) =>
        set({
            isBlocked: blocked,
            blockedMessage:
                message || 'Действие учётной записи приостановлено',
        }),
    clearBlocked: () =>
        set({
            isBlocked: false,
            blockedMessage: 'Действие учётной записи приостановлено',
        }),
}))
