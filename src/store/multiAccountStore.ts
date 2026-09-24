import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/@types/auth'

export type SavedAccount = {
    userId: string
    userName: string
    phone?: string
    email?: string
    avatar?: string
    agencyName?: string
    token: string
    lastActiveAt: number
}

type MultiAccountState = {
    accounts: SavedAccount[]
    saveAccount: (user: User, token: string) => void
    removeAccount: (userId: string) => void
    clearAccounts: () => void
}

export const useMultiAccountStore = create<MultiAccountState>()(
    persist(
        (set) => ({
            accounts: [],
            saveAccount: (user, token) => {
                if (!user.userId || !token) return
                set((state) => {
                    const filtered = state.accounts.filter(
                        (acc) => acc.userId !== user.userId,
                    )
                    const updated: SavedAccount = {
                        userId: user.userId,
                        userName: user.userName || 'Без имени',
                        phone: user.phone,
                        email: user.email,
                        avatar: user.avatar,
                        agencyName: user.agencyName || user.agency?.name,
                        token,
                        lastActiveAt: Date.now(),
                    }
                    return {
                        accounts: [updated, ...filtered],
                    }
                })
            },
            removeAccount: (userId) =>
                set((state) => ({
                    accounts: state.accounts.filter(
                        (acc) => acc.userId !== userId,
                    ),
                })),
            clearAccounts: () => set({ accounts: [] }),
        }),
        {
            name: 'multiAccounts',
            storage: createJSONStorage(() => localStorage),
        },
    ),
)
