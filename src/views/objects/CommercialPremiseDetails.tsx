import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { isImageSlide } from 'yet-another-react-lightbox'
import { TbBuildingSkyscraper, TbHeart, TbScale, TbPlus, TbHeartFilled } from 'react-icons/tb'
import ImageGallery from '@/components/shared/ImageGallery'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useComparisonStore } from '@/store/comparisonStore'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { apiGetRealtyProperty } from '@/services/ObjectsService'
import RewardHelpButton from './components/RewardHelpButton'
import {
    FLOOR_PLAN_HIGHLIGHT_COLOR,
    FloorPlanGallerySlide,
    loadImageSize,
} from './components/FloorPlanOverlay'
import SpecialOfferBadges from './components/SpecialOfferBadges'
import type { Premise } from './types'
import {
    formatArea,
    formatPrice,
    getPremiseCoverImage,
    getPremisePreviewSlides,
    type PremisePreviewSlide,
} from './utils'
import {
    getMediaOriginalSrc,
    getResponsiveImageAttrs,
} from '@/utils/mediaImage'
type DetailRowProps = {
    label: string
    value?: string | number | null
    className?: string
}

const DetailRow = ({ label, value, className = '' }: DetailRowProps) => (
    <div className={`rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-700/50 ${className}`}>
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
    const [previewIndex, setPreviewIndex] = useState(-1)
    const [previewSlides, setPreviewSlides] = useState<PremisePreviewSlide[]>([])
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

    const layoutImage = getMediaOriginalSrc(premise.layoutImage)
    const coverImage = getPremiseCoverImage(premise)
    const title = `План коммерческого помещения №${premise.number}`

    const openPreview = async () => {
        const slides = getPremisePreviewSlides(premise)
        if (slides.length === 0) return

        const floorSlide = slides.find((slide) => Boolean(slide.floorPath))
        if (floorSlide) {
            const size = await loadImageSize(floorSlide.src)
            if (size) {
                setPreviewSlides(
                    slides.map((slide) =>
                        slide.src === floorSlide.src
                            ? {
                                  ...slide,
                                  width: size.width,
                                  height: size.height,
                              }
                            : slide,
                    ),
                )
                setPreviewIndex(0)
                return
            }
        }

        setPreviewSlides(slides)
        setPreviewIndex(0)
    }

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
                            <RewardHelpButton />
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
                        <div className="order-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white flex">
                            {layoutImage ? (
                                <button
                                    type="button"
                                    className="flex min-h-[360px] w-full cursor-zoom-in items-center justify-center rounded-xl bg-white p-3 dark:bg-white"
                                    onClick={() => void openPreview()}
                                >
                                    <img
                                        {...getResponsiveImageAttrs(
                                            premise.layoutImage,
                                            '(min-width: 1024px) 420px, 100vw',
                                        )}
                                        alt={title}
                                        className="max-h-[560px] max-w-[92%] object-contain"
                                    />
                                </button>
                            ) : coverImage ? (
                                <button
                                    type="button"
                                    className="flex min-h-[360px] w-full cursor-zoom-in items-center justify-center rounded-xl bg-white p-3 dark:bg-white"
                                    onClick={() => void openPreview()}
                                >
                                    <img
                                        {...getResponsiveImageAttrs(
                                            coverImage,
                                            '(min-width: 1024px) 420px, 100vw',
                                        )}
                                        alt="Коммерческое помещение"
                                        className="max-h-[560px] max-w-[92%] object-contain"
                                    />
                                </button>
                            ) : (
                                <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                    Планировка отсутствует
                                </div>
                            )}
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
                                        ? `${formatPrice(premise.price)}`
                                        : undefined
                                }
                            />
                            <DetailRow
                                label="Цена за м²"
                                value={
                                    (premise.pricePerSqm != null || (premise.price != null && premise.area > 0))
                                        ? `${formatPrice(premise.pricePerSqm ?? premise.price! / premise.area)}`
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
                            <DetailRow
                                label="Менеджер"
                                value="Алиса Зайкина · +7 917 419 61 51"
                                className="bg-primary/10 dark:bg-primary/20"
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

            <ImageGallery
                index={previewIndex}
                slides={previewSlides}
                render={{
                    slide: (props) => {
                        if (
                            !isImageSlide(props.slide) ||
                            !('floorPath' in props.slide) ||
                            !props.slide.floorPath
                        ) {
                            return undefined
                        }

                        return (
                            <FloorPlanGallerySlide
                                {...props}
                                floorPath={String(props.slide.floorPath)}
                                color={FLOOR_PLAN_HIGHLIGHT_COLOR}
                            />
                        )
                    },
                }}
                onClose={() => setPreviewIndex(-1)}
            />
        </Container>
    )
}

export default CommercialPremiseDetails
