import { create } from 'zustand'
import {
    apiAddRealtyCollectionProperty,
    apiRemoveRealtyCollectionProperty,
    clearDefaultRealtyCollectionCache,
} from '@/services/RealtyCollectionsService'
import type { Premise } from '@/views/objects/types'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

type FavoritesState = {
    favoriteIds: string[]
}

type FavoritesAction = {
    setFavoriteIds: (ids: string[]) => void
    addPremise: (propertyId: string) => Promise<void>
    removePremise: (propertyId: string) => Promise<void>
    togglePremise: (premise: Premise | { id: string; number?: string }) => Promise<void>
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
            if (exists) {
                set((state) => ({
                    favoriteIds: state.favoriteIds.filter(
                        (id) => id !== propertyId,
                    ),
                }))
            }

            try {
                await apiRemoveRealtyCollectionProperty(propertyId)
            } catch (error) {
                if (exists) {
                    set((state) => ({
                        favoriteIds: [...state.favoriteIds, propertyId],
                    }))
                }
                throw error
            }
        },
        togglePremise: async (premise) => {
            const numLabel = premise.number ? ` №${premise.number}` : ''
            if (get().isFavorite(premise.id)) {
                await get().removePremise(premise.id)
                toast.push(
                    <Notification type="info">
                        Помещение{numLabel} удалено из избранного
                    </Notification>,
                    { duration: 3000 },
                )
                return
            }
            await get().addPremise(premise.id)
            toast.push(
                <Notification type="success">
                    Помещение{numLabel} добавлено в избранное
                </Notification>,
                { duration: 3000 },
            )
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
