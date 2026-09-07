import { create } from 'zustand'
import {
    apiAddComparisonCollectionProperty,
    apiRemoveComparisonCollectionProperty,
    clearComparisonRealtyCollectionCache,
} from '@/services/RealtyCollectionsService'
import type { Premise } from '@/views/objects/types'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

type ComparisonState = {
    comparisonIds: string[]
}

type ComparisonAction = {
    setComparisonIds: (ids: string[]) => void
    addPremise: (propertyId: string) => Promise<void>
    removePremise: (propertyId: string) => Promise<void>
    togglePremise: (premise: Premise | { id: string; number?: string }) => Promise<void>
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
            const numLabel = premise.number ? ` №${premise.number}` : ''
            if (get().isCompared(premise.id)) {
                await get().removePremise(premise.id)
                toast.push(
                    <Notification type="info">
                        Помещение{numLabel} удалено из сравнения
                    </Notification>,
                    { duration: 3000 },
                )
                return
            }
            await get().addPremise(premise.id)
            toast.push(
                <Notification type="success">
                    Помещение{numLabel} добавлено в сравнение
                </Notification>,
                { duration: 3000 },
            )
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
