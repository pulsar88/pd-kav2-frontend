import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Premise } from '@/views/objects/types'

type FavoritesState = {
    premises: Premise[]
}

type FavoritesAction = {
    addPremise: (premise: Premise) => void
    removePremise: (premiseId: string) => void
    togglePremise: (premise: Premise) => void
    isFavorite: (premiseId: string) => boolean
    clear: () => void
}

export const useFavoritesStore = create<FavoritesState & FavoritesAction>()(
    persist(
        (set, get) => ({
            premises: [],
            addPremise: (premise) =>
                set((state) => {
                    const index = state.premises.findIndex(
                        (item) => item.id === premise.id,
                    )

                    if (index >= 0) {
                        const next = [...state.premises]
                        next[index] = { ...next[index], ...premise }
                        return { premises: next }
                    }

                    return { premises: [...state.premises, premise] }
                }),
            removePremise: (premiseId) =>
                set((state) => ({
                    premises: state.premises.filter(
                        (item) => item.id !== premiseId,
                    ),
                })),
            togglePremise: (premise) => {
                const exists = get().premises.some(
                    (item) => item.id === premise.id,
                )
                if (exists) {
                    get().removePremise(premise.id)
                    return
                }
                get().addPremise(premise)
            },
            isFavorite: (premiseId) =>
                get().premises.some((item) => item.id === premiseId),
            clear: () => set({ premises: [] }),
        }),
        {
            name: 'favoritePremises',
        },
    ),
)
