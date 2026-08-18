import { useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import {
    apiGetRealtyObject,
    apiGetRealtyProperty,
} from '@/services/ObjectsService'
import { apiGetCurrentUser } from '@/services/AuthService'
import type { Complex, Premise } from '@/views/objects/types'
import { formatRuPhone } from '@/views/fixations/utils'
import FavoritePremisesList from './FavoritePremisesList'
import FavoritePremisesSelected from './FavoritePremisesSelected'
import {
    downloadCommercialProposalPdf,
    openCommercialProposalPreviewWindow,
} from './downloadCommercialProposalPdf'
import { mergePremiseDetails } from './utils'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const enrichPremiseForProposal = async (premise: Premise): Promise<Premise> => {
    const details = await apiGetRealtyProperty(premise.id)
    return mergePremiseDetails(premise, details)
}

const FavoritePremises = () => {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerateProposal = async () => {
        if (!selectedIds.length) return

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

        setIsGenerating(true)
        try {
            const selectedPremises = (
                await Promise.all(
                    selectedIds.map((id) => apiGetRealtyProperty(id)),
                )
            ).filter((premise): premise is Premise => premise != null)

            const enrichedPremises = await Promise.all(
                selectedPremises.map((premise) =>
                    enrichPremiseForProposal(premise),
                ),
            )

            const complexIds = [
                ...new Set(
                    enrichedPremises
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
                enrichedPremises.map((premise) => ({
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
            setIsGenerating(false)
        }
    }

    return (
        <>
            <Container>
                <div className="mb-6">
                    <h3 className="mb-1">Избранные помещения</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Выберите помещения и сформируйте коммерческое
                        предложение в PDF
                    </p>
                </div>

                <AdaptiveCard>
                    <FavoritePremisesList
                        selectedIds={selectedIds}
                        onSelectedIdsChange={setSelectedIds}
                    />
                </AdaptiveCard>
            </Container>
            <FavoritePremisesSelected
                selectedCount={selectedIds.length}
                isGenerating={isGenerating}
                onClear={() => setSelectedIds([])}
                onGenerate={() => void handleGenerateProposal()}
            />
        </>
    )
}

export default FavoritePremises
