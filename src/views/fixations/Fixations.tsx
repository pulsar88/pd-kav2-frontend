import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import Button from '@/components/ui/Button'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import { TbPlus } from 'react-icons/tb'
import FixationsTable from './components/FixationsTable'
import FixationsCreateWizardDialog from './components/FixationsCreateWizardDialog'
import type { FixationCreateInitialSelection } from './createWizard.types'

const Fixations = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [tableRefreshKey, setTableRefreshKey] = useState(0)

    const initialSelection = useMemo<FixationCreateInitialSelection | null>(
        () => {
            if (searchParams.get('create') !== '1') return null

            const complexId = searchParams.get('complexId') || undefined
            const apartmentNumber =
                searchParams.get('apartmentNumber') || undefined
            const propertyIdRaw = searchParams.get('propertyId')
            const propertyId = propertyIdRaw
                ? Number(propertyIdRaw)
                : undefined
            const roomsRaw = searchParams.get('rooms')
            const rooms = roomsRaw != null ? Number(roomsRaw) : undefined

            return {
                complexId,
                apartmentNumber,
                propertyId:
                    propertyId != null && Number.isFinite(propertyId)
                        ? propertyId
                        : undefined,
                rooms:
                    rooms != null && Number.isFinite(rooms) ? rooms : undefined,
            }
        },
        [searchParams],
    )

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setIsCreateOpen(true)
        }
    }, [searchParams])

    const handleCloseCreate = () => {
        setIsCreateOpen(false)

        if (
            searchParams.has('create') ||
            searchParams.has('complexId') ||
            searchParams.has('propertyId') ||
            searchParams.has('apartmentNumber') ||
            searchParams.has('rooms')
        ) {
            const next = new URLSearchParams(searchParams)
            next.delete('create')
            next.delete('complexId')
            next.delete('propertyId')
            next.delete('apartmentNumber')
            next.delete('rooms')
            setSearchParams(next, { replace: true })
        }
    }

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="mb-1">Фиксации</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Список фиксаций клиентов и управление сроками
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={() => setIsCreateOpen(true)}
                        >
                            Создать фиксацию
                        </Button>
                    </div>
                    <FixationsTable refreshKey={tableRefreshKey} />
                </div>
            </AdaptiveCard>
            <FixationsCreateWizardDialog
                isOpen={isCreateOpen}
                initialSelection={initialSelection}
                onClose={handleCloseCreate}
                onSuccess={() => setTableRefreshKey((key) => key + 1)}
            />
        </Container>
    )
}

export default Fixations
