import { create } from 'zustand'
import {
    apiAddRealtyCollectionProperty,
    apiRemoveRealtyCollectionProperty,
    clearDefaultRealtyCollectionCache,
} from '@/services/RealtyCollectionsService'
import type { Premise } from '@/views/objects/types'

type FavoritesState = {
    favoriteIds: string[]
}

type FavoritesAction = {
    setFavoriteIds: (ids: string[]) => void
    addPremise: (propertyId: string) => Promise<void>
    removePremise: (propertyId: string) => Promise<void>
    togglePremise: (premise: Premise) => Promise<void>
    isFavorite: (premiseId: string) => boolean
    clear: () => void
}

export const useFavoritesStore = create<FavoritesState & FavoritesAction>(
    (set, get) => ({
        favoriteIds: [],
        setFavoriteIds: (ids) => set({ favoriteIds: ids }),
        addPremise: async (propertyId) => {
            const exists = get().isFavorite(propertyId)
            if (exists) return

            set((state) => ({
                favoriteIds: [...state.favoriteIds, propertyId],
            }))

            try {
                await apiAddRealtyCollectionProperty(propertyId)
            } catch (error) {
                set((state) => ({
                    favoriteIds: state.favoriteIds.filter(
                        (id) => id !== propertyId,
                    ),
                }))
                throw error
            }
        },
        removePremise: async (propertyId) => {
            const exists = get().isFavorite(propertyId)
            if (!exists) return

            set((state) => ({
                favoriteIds: state.favoriteIds.filter(
                    (id) => id !== propertyId,
                ),
            }))

            try {
                await apiRemoveRealtyCollectionProperty(propertyId)
            } catch (error) {
                set((state) => ({
                    favoriteIds: [...state.favoriteIds, propertyId],
                }))
                throw error
            }
        },
        togglePremise: async (premise) => {
            if (get().isFavorite(premise.id)) {
                await get().removePremise(premise.id)
                return
            }
            await get().addPremise(premise.id)
        },
        isFavorite: (premiseId) => get().favoriteIds.includes(premiseId),
        clear: () => {
            clearDefaultRealtyCollectionCache()
            set({ favoriteIds: [] })
        },
    }),
)

export const clearFavoritesStore = () => {
    useFavoritesStore.getState().clear()
}
