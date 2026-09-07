import { create } from 'zustand'
import {
    apiAddComparisonCollectionProperty,
    apiRemoveComparisonCollectionProperty,
    clearComparisonRealtyCollectionCache,
} from '@/services/RealtyCollectionsService'
import type { Premise } from '@/views/objects/types'

type ComparisonState = {
    comparisonIds: string[]
}

type ComparisonAction = {
    setComparisonIds: (ids: string[]) => void
    addPremise: (propertyId: string) => Promise<void>
    removePremise: (propertyId: string) => Promise<void>
    togglePremise: (premise: Premise | { id: string }) => Promise<void>
    isCompared: (premiseId: string) => boolean
    clear: () => void
}

export const useComparisonStore = create<ComparisonState & ComparisonAction>(
    (set, get) => ({
        comparisonIds: [],
        setComparisonIds: (ids) => set({ comparisonIds: ids }),
        addPremise: async (propertyId) => {
            const exists = get().isCompared(propertyId)
            if (exists) return

            set((state) => ({
                comparisonIds: [...state.comparisonIds, propertyId],
            }))

            try {
                await apiAddComparisonCollectionProperty(propertyId)
            } catch (error) {
                set((state) => ({
                    comparisonIds: state.comparisonIds.filter(
                        (id) => id !== propertyId,
                    ),
                }))
                throw error
            }
        },
        removePremise: async (propertyId) => {
            const exists = get().isCompared(propertyId)
            if (exists) {
                set((state) => ({
                    comparisonIds: state.comparisonIds.filter(
                        (id) => id !== propertyId,
                    ),
                }))
            }

            try {
                await apiRemoveComparisonCollectionProperty(propertyId)
            } catch (error) {
                if (exists) {
                    set((state) => ({
                        comparisonIds: [...state.comparisonIds, propertyId],
                    }))
                }
                throw error
            }
        },
        togglePremise: async (premise) => {
            if (get().isCompared(premise.id)) {
                await get().removePremise(premise.id)
                return
            }
            await get().addPremise(premise.id)
        },
        isCompared: (premiseId) => get().comparisonIds.includes(premiseId),
        clear: () => {
            clearComparisonRealtyCollectionCache()
            set({ comparisonIds: [] })
        },
    }),
)

export const clearComparisonStore = () => {
    useComparisonStore.getState().clear()
}
