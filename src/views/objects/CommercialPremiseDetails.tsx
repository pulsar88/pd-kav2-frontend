import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { TbBuildingSkyscraper, TbHeart, TbScale, TbPlus, TbHeartFilled } from 'react-icons/tb'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useComparisonStore } from '@/store/comparisonStore'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { apiGetRealtyProperty } from '@/services/ObjectsService'
import LayoutPreviewDialog from './components/LayoutPreviewDialog'
import SpecialOfferBadges from './components/SpecialOfferBadges'
import type { Premise } from './types'
import { formatArea, formatPrice, getPremiseCoverImage } from './utils'

type DetailRowProps = {
    label: string
    value?: string | number | null
}

const DetailRow = ({ label, value }: DetailRowProps) => (
    <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-gray-100">
            {value || '—'}
        </p>
    </div>
)

const CommercialPremiseDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [premise, setPremise] = useState<Premise | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(id))
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [isFloorPreviewOpen, setIsFloorPreviewOpen] = useState(false)
    const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
    const comparisonIds = useComparisonStore((state) => state.comparisonIds)

    useEffect(() => {
        if (!id) {
            setPremise(null)
            setIsLoading(false)
            return
        }

        let cancelled = false
        setIsLoading(true)

        void apiGetRealtyProperty(id)
            .then((result) => {
                if (!cancelled) {
                    setPremise(result)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [id])

    if (isLoading) {
        return (
            <Container>
                <AdaptiveCard>
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                        Загрузка коммерческого помещения...
                    </div>
                </AdaptiveCard>
            </Container>
        )
    }

    if (!premise) {
        return (
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col items-start gap-4 py-6">
                        <h3>Коммерческое помещение не найдено</h3>
                        <Button onClick={() => navigate('/commercial-premises')}>
                            К списку коммерческих помещений
                        </Button>
                    </div>
                </AdaptiveCard>
            </Container>
        )
    }

    const layoutImage = premise.layoutImage
    const floorPlanImage = premise.floorPlanImage
    const coverImage = getPremiseCoverImage(premise)
    const title = `План коммерческого помещения №${premise.number}`

    return (
        <Container>
            <Button
                className="mb-4"
                onClick={() => navigate('/commercial-premises')}
            >
                К списку коммерческих помещений
            </Button>

            <AdaptiveCard className="bg-white dark:bg-gray-800">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Коммерческое помещение №{premise.number}
                            </h2>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {premise.complexName ? (
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-neutral">
                                    <TbBuildingSkyscraper />
                                    {premise.complexName}
                                </span>
                            ) : null}
                            {premise.statusName || premise.status?.name ? (
                                <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-bold text-gray-900 shadow-sm" style={{ backgroundColor: premise.statusColor || premise.status?.color || '#e5e7eb' }}>
                                    {premise.statusName || premise.status?.name}
                                </span>
                            ) : null}
                            <SpecialOfferBadges
                                offers={premise.specialOffers}
                                max={3}
                                interactiveDetails
                            />
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
                        <div className="order-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white">
                            {layoutImage ? (
                                <button
                                    type="button"
                                    className="block w-full cursor-zoom-in rounded-xl bg-white p-3 dark:bg-white"
                                    onClick={() => setIsPreviewOpen(true)}
                                >
                                    <img
                                        src={layoutImage}
                                        alt={title}
                                        className="max-h-[620px] w-full object-contain"
                                    />
                                </button>
                            ) : coverImage ? (
                                <img
                                    src={coverImage}
                                    alt="Коммерческое помещение"
                                    className="max-h-[620px] w-full object-contain"
                                />
                            ) : (
                                <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                    Планировка отсутствует
                                </div>
                            )}

                            {floorPlanImage && layoutImage ? (
                                <button
                                    type="button"
                                    className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => setIsFloorPreviewOpen(true)}
                                >
                                    Посмотреть план этажа
                                </button>
                            ) : null}
                        </div>

                        <div className="order-1 grid content-start grid-cols-1 gap-3 text-base sm:grid-cols-2 lg:grid-cols-1">
                            <DetailRow label="ЖК" value={premise.complexName} />
                            <DetailRow label="Адрес" value={premise.address} />
                            <DetailRow
                                label="Тип помещения"
                                value={premise.typeName || premise.typeCode}
                            />
                            <DetailRow
                                label="Площадь"
                                value={formatArea(premise.area)}
                            />
                            <DetailRow label="Этаж" value={premise.floor} />
                            <DetailRow
                                label="Цена"
                                value={
                                    premise.price != null
                                        ? `${formatPrice(premise.price)} ₽`
                                        : undefined
                                }
                            />
                            <DetailRow
                                label="Цена за м²"
                                value={
                                    (premise.pricePerSqm != null || (premise.price != null && premise.area > 0))
                                        ? `${formatPrice(premise.pricePerSqm ?? premise.price! / premise.area)} ₽`
                                        : undefined
                                }
                            />
                            <DetailRow
                                label="Материал"
                                value={premise.material}
                            />
                            <DetailRow
                                label="Отделка"
                                value={premise.finishing}
                            />
                            <DetailRow
                                label="Статус"
                                value={
                                    premise.statusName || premise.status?.name
                                }
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-5 dark:border-gray-700">
                        <Button type="button" icon={favoriteIds.includes(premise.id) ? <TbHeartFilled /> : <TbHeart />} onClick={() => useFavoritesStore.getState().togglePremise(premise)}>
                            {favoriteIds.includes(premise.id) ? 'В избранном' : 'В избранное'}
                        </Button>
                        <Button type="button" icon={<TbScale />} onClick={() => useComparisonStore.getState().togglePremise(premise)}>
                            {comparisonIds.includes(premise.id) ? 'В сравнении' : 'В сравнение'}
                        </Button>
                        <Button type="button" variant="solid" icon={<TbPlus />} onClick={() => {
                                const params = new URLSearchParams({
                                    create: '1',
                                    propertyId: String(premise.id),
                                    apartmentNumber: premise.number,
                                })
                                if (premise.complexId) {
                                    params.set('complexId', premise.complexId)
                                }
                                if (premise.rooms != null) {
                                    params.set('rooms', String(premise.rooms))
                                }
                                navigate(`/fixations?${params.toString()}`)
                            }}>
                            Создать фиксацию
                        </Button>
                    </div>

                    {premise.description ? (
                        <section className="border-t border-gray-200 pt-5 dark:border-gray-700">
                            <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                                Описание
                            </h3>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                {premise.description}
                            </p>
                        </section>
                    ) : null}
                </div>
            </AdaptiveCard>

            <LayoutPreviewDialog
                isOpen={isPreviewOpen}
                imageSrc={layoutImage}
                title={title}
                onClose={() => setIsPreviewOpen(false)}
            />
            <LayoutPreviewDialog
                isOpen={isFloorPreviewOpen}
                imageSrc={floorPlanImage}
                title={`План этажа — ${premise.complexName || ''}`}
                onClose={() => setIsFloorPreviewOpen(false)}
            />
        </Container>
    )
}

export default CommercialPremiseDetails
