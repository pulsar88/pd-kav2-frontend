import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/@types/auth'

export type FavoriteAccount = {
    userId: string
    userName: string
    phone?: string
    email?: string
    avatar?: string
    agencyName?: string
    role?: string
    token: string
    savedAt: number
}

type FavoriteAccountsState = {
    accounts: FavoriteAccount[]
    addFavoriteAccount: (user: User, token: string) => void
    removeFavoriteAccount: (userId: string) => void
    clearFavoriteAccounts: () => void
}

export const useFavoriteAccountsStore = create<FavoriteAccountsState>()(
    persist(
        (set) => ({
            accounts: [],
            addFavoriteAccount: (user, token) => {
                if (!user.userId || !token) return

                const accountUserId = user.userId
                set((state) => {
                    const filtered = state.accounts.filter(
                        (item) => item.userId !== user.userId,
                    )
                    const newAccount: FavoriteAccount = {
                        userId: accountUserId,
                        userName: user.userName || 'Без имени',
                        phone: user.phone ?? undefined,
                        email: user.email ?? undefined,
                        avatar: user.avatar ?? undefined,
                        agencyName: user.agencyName || user.agency?.name,
                        role: user.authority?.[0],
                        token,
                        savedAt: Date.now(),
                    }
                    return {
                        accounts: [newAccount, ...filtered],
                    }
                })
            },
            removeFavoriteAccount: (userId) =>
                set((state) => ({
                    accounts: state.accounts.filter((acc) => acc.userId !== userId),
                })),
            clearFavoriteAccounts: () => set({ accounts: [] }),
        }),
        {
            name: 'favorite_accounts',
            storage: createJSONStorage(() => localStorage),
        },
    ),
)
