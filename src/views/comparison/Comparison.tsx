import { useCallback, useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Skeleton from '@/components/ui/Skeleton'
import { useAuth } from '@/auth'
import { apiGetAllComparisonCollectionProperties } from '@/services/RealtyCollectionsService'
import { apiGetRealtyObject } from '@/services/ObjectsService'
import { apiGetCurrentUser } from '@/services/AuthService'
import { useComparisonStore } from '@/store/comparisonStore'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { formatRuPhone } from '@/views/fixations/utils'
import type { Complex, Premise } from '@/views/objects/types'
import {
    downloadCommercialProposalPdf,
    openCommercialProposalPreviewWindow,
} from '@/views/favorite-premises/downloadCommercialProposalPdf'
import ComparisonHeader from './components/ComparisonHeader'
import ComparisonMatrix from './components/ComparisonMatrix'
import ComparisonEmpty from './components/ComparisonEmpty'

const ComparisonSkeleton = () => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <Skeleton width={200} height={28} />
            <Skeleton width={280} height={36} />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
)

const Comparison = () => {
    const { authenticated } = useAuth()
    const removePremise = useComparisonStore((state) => state.removePremise)
    const setComparisonIds = useComparisonStore(
        (state) => state.setComparisonIds,
    )

    const [premises, setPremises] = useState<Premise[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(authenticated)
    const [onlyDifferences, setOnlyDifferences] = useState(false)
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
    const [isGeneratingProposal, setIsGeneratingProposal] = useState(false)

    const loadComparisonData = useCallback(async () => {
        if (!authenticated) {
            setPremises([])
            setSelectedIds([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const rawItems = await apiGetAllComparisonCollectionProperties()
            const ids = rawItems.map((item) => item.id)
            setComparisonIds(ids)
            setPremises(rawItems)
            // Помещения для КП не выбираем по умолчанию — пользователь
            // сам отмечает нужные (или жмет «Выбрать все для КП»)
            setSelectedIds([])
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        error,
                        'Не удалось загрузить подборку для сравнения',
                    )}
                </Notification>,
            )
        } finally {
            setIsLoading(false)
        }
    }, [authenticated, setComparisonIds])

    useEffect(() => {
        void loadComparisonData()
    }, [loadComparisonData])

    const handleToggleSelect = (premiseId: string, selected: boolean) => {
        if (selected) {
            setSelectedIds((prev) =>
                prev.includes(premiseId) ? prev : [...prev, premiseId],
            )
        } else {
            setSelectedIds((prev) => prev.filter((id) => id !== premiseId))
        }
    }

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedIds(premises.map((p) => p.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleRemovePremise = async (premiseId: string) => {
        const removed = premises.find((p) => p.id === premiseId)
        if (!removed) return

        // Optimistic removal
        setPremises((prev) => prev.filter((p) => p.id !== premiseId))
        setSelectedIds((prev) => prev.filter((id) => id !== premiseId))

        try {
            await removePremise(premiseId)
        } catch (error) {
            // Rollback on error
            setPremises((prev) => [...prev, removed])
            setSelectedIds((prev) => [...prev, premiseId])
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        error,
                        'Не удалось удалить помещение из сравнения',
                    )}
                </Notification>,
            )
        }
    }

    const handleConfirmClearAll = async () => {
        setIsClearDialogOpen(false)
        const currentPremises = [...premises]
        setPremises([])
        setSelectedIds([])

        try {
            await Promise.all(
                currentPremises.map((p) => removePremise(p.id)),
            )
            setComparisonIds([])
            toast.push(
                <Notification type="success">
                    Список сравнения успешно очищен
                </Notification>,
            )
        } catch (error) {
            setPremises(currentPremises)
            setSelectedIds(currentPremises.map((p) => p.id))
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        error,
                        'Не удалось очистить список сравнения',
                    )}
                </Notification>,
            )
        }
    }

    const handleGenerateProposal = async () => {
        const chosenPremises = premises.filter((p) =>
            selectedIds.includes(p.id),
        )
        if (!chosenPremises.length) return

        const previewWindow = openCommercialProposalPreviewWindow()
        if (!previewWindow) {
            toast.push(
                <Notification type="danger">
                    Не удалось открыть окно предпросмотра. Разрешите
                    всплывающие окна для этого сайта.
                </Notification>,
                { placement: 'top-center' },
            )
            return
        }

        setIsGeneratingProposal(true)
        try {
            const complexIds = [
                ...new Set(
                    chosenPremises
                        .map((premise) => premise.complexId)
                        .filter((id): id is string => Boolean(id)),
                ),
            ]

            const complexes = await Promise.all(
                complexIds.map((complexId) => apiGetRealtyObject(complexId)),
            )

            const complexById = new Map(
                complexes
                    .filter((complex): complex is Complex => complex != null)
                    .map((complex) => [complex.id, complex]),
            )

            const currentUser = await apiGetCurrentUser()

            await downloadCommercialProposalPdf(
                chosenPremises.map((premise) => ({
                    premise,
                    complex: premise.complexId
                        ? complexById.get(premise.complexId) || null
                        : null,
                })),
                {
                    name: currentUser.userName?.trim() || '',
                    phone: currentUser.phone
                        ? formatRuPhone(currentUser.phone)
                        : '',
                },
                previewWindow,
            )
        } catch (error) {
            previewWindow.close()
            toast.push(
                <Notification type="danger">
                    Не удалось сформировать коммерческое предложение
                </Notification>,
                { placement: 'top-center' },
            )
            console.error(error)
        } finally {
            setIsGeneratingProposal(false)
        }
    }

    const allSelected =
        premises.length > 0 && selectedIds.length === premises.length
    const someSelected =
        selectedIds.length > 0 && selectedIds.length < premises.length

    if (isLoading && premises.length === 0) {
        return (
            <Container>
                <AdaptiveCard>
                    <ComparisonSkeleton />
                </AdaptiveCard>
            </Container>
        )
    }

    return (
        <>
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col gap-5 sm:gap-6">
                        <ComparisonHeader
                            totalCount={premises.length}
                            selectedCount={selectedIds.length}
                            allSelected={allSelected}
                            someSelected={someSelected}
                            onSelectAllChange={handleSelectAll}
                            onlyDifferences={onlyDifferences}
                            onOnlyDifferencesChange={setOnlyDifferences}
                            onClearAll={() => setIsClearDialogOpen(true)}
                            onGenerateProposal={() =>
                                void handleGenerateProposal()
                            }
                            isGeneratingProposal={isGeneratingProposal}
                        />

                        {premises.length === 0 ? (
                            <ComparisonEmpty />
                        ) : (
                            <ComparisonMatrix
                                premises={premises}
                                onlyDifferences={onlyDifferences}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                onRemovePremise={handleRemovePremise}
                            />
                        )}
                    </div>
                </AdaptiveCard>
            </Container>

            <ConfirmDialog
                isOpen={isClearDialogOpen}
                type="danger"
                title="Очистить сравнение"
                confirmText="Очистить"
                cancelText="Отмена"
                onClose={() => setIsClearDialogOpen(false)}
                onCancel={() => setIsClearDialogOpen(false)}
                onConfirm={() => void handleConfirmClearAll()}
            >
                <p>
                    Вы уверены, что хотите удалить все помещения из сравнения?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default Comparison
