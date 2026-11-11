import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { TbBuildingSkyscraper, TbZoomIn, TbHeart, TbHeartFilled, TbScale } from 'react-icons/tb'
import { isImageSlide } from 'yet-another-react-lightbox'
import ImageGallery from '@/components/shared/ImageGallery'
import Button from '@/components/ui/Button'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useComparisonStore } from '@/store/comparisonStore'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Pagination from '@/components/ui/Pagination'
import ObjectsSearchForm from './components/ObjectsSearchForm'
import SpecialOfferBadges from './components/SpecialOfferBadges'
import RewardHelpButton from './components/RewardHelpButton'
import {
    FLOOR_PLAN_HIGHLIGHT_COLOR,
    FloorPlanGallerySlide,
    loadImageSize,
} from './components/FloorPlanOverlay'
import {
    apiGetRealtyProperties,
    type GetRealtyPropertiesResponse,
} from '@/services/ObjectsService'
import type { ObjectsSearchFilters, Premise } from './types'
import {
    getMediaOriginalSrc,
    getResponsiveImageAttrs,
} from '@/utils/mediaImage'
import {
    formatArea,
    formatPrice,
    getPremiseCoverImage,
    getPremisePreviewSlides,
    getPremiseTypeLabel,
    type PremisePreviewSlide,
} from './utils'

const PAGE_SIZE = 20

const emptyFilters: ObjectsSearchFilters = {
    type: ['office'],
    realtyProjectIds: [],
    rooms: [],
    fromInvestor: '',
}

type CommercialCardProps = {
    item: Premise
}

const CommercialCard = ({ item }: CommercialCardProps) => {
    const navigate = useNavigate()
    const [previewIndex, setPreviewIndex] = useState(-1)
    const [previewSlides, setPreviewSlides] = useState<PremisePreviewSlide[]>([])
    const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
    const comparisonIds = useComparisonStore((state) => state.comparisonIds)

    const coverImage = getPremiseCoverImage(item)
    const planImage = getMediaOriginalSrc(
        item.layoutImage || item.floorPlanImage,
    )
    const hasOffers = Boolean(item.specialOffers?.length)

    const openDetails = () => {
        navigate(`/commercial-premises/${item.id}`)
    }

    const openPreview = async () => {
        const slides = getPremisePreviewSlides(item)
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
        <article className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-900">
            <RewardHelpButton wrapperClass="absolute right-3 top-3 z-10" />
            <button
                type="button"
                className="block w-full text-left"
                onClick={() => (planImage ? void openPreview() : openDetails())}
            >
                <div className="group/plan relative flex h-52 items-center justify-center overflow-hidden bg-gray-100 p-3 dark:bg-white">
                    {coverImage ? (
                        <img
                            {...getResponsiveImageAttrs(
                                coverImage,
                                '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw',
                            )}
                            className="h-full w-full object-contain"
                            alt=""
                        />
                    ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Планировка отсутствует
                        </span>
                    )}
                    {planImage ? (
                        <span
                            role="button"
                            tabIndex={0}
                            className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-gray-700 opacity-0 shadow-sm transition group-hover/plan:opacity-100 dark:bg-gray-800/90 dark:text-gray-100"
                            onClick={(event) => {
                                event.stopPropagation()
                                void openPreview()
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    void openPreview()
                                }
                            }}
                        >
                            <TbZoomIn />
                            Увеличить
                        </span>
                    ) : null}
                </div>
            </button>

            <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {item.complexName ? (
                        <span className="inline-flex max-w-full items-center gap-1 truncate rounded-lg bg-primary px-2 py-1 text-xs font-bold text-neutral">
                            <TbBuildingSkyscraper className="shrink-0" />
                            <span className="truncate">{item.complexName}</span>
                        </span>
                    ) : null}
                    {item.statusName || item.status?.name ? (
                        <span
                            className="inline-flex rounded-lg px-2 py-1 text-xs font-bold shadow-sm"
                            style={{
                                backgroundColor:
                                    item.statusColor || item.status?.color || '#e5e7eb',
                                color: '#111827',
                            }}
                        >
                            {item.statusName || item.status?.name}
                        </span>
                    ) : null}
                    {hasOffers ? (
                        <SpecialOfferBadges
                            offers={item.specialOffers}
                            max={2}
                            interactiveDetails
                        />
                    ) : null}
                </div>

                <button
                    type="button"
                    className="block w-full text-left"
                    onClick={openDetails}
                >
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {item.complexName || 'Коммерческое помещение'}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {getPremiseTypeLabel(item)} · № {item.number}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {formatArea(item.area)} · этаж {item.floor}
                    </p>
                    <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                        {item.price != null
                            ? formatPrice(item.price)
                            : 'Цена не указана'}
                    </p>
                </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <Button
                    type="button"
                    size="sm"
                    variant="plain"
                    icon={favoriteIds.includes(item.id) ? <TbHeartFilled /> : <TbHeart />}
                    onClick={() => useFavoritesStore.getState().togglePremise(item)}
                >
                    {favoriteIds.includes(item.id) ? 'В избранном' : 'В избранное'}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="plain"
                    icon={<TbScale />}
                    onClick={() => useComparisonStore.getState().togglePremise(item)}
                >
                    {comparisonIds.includes(item.id) ? 'В сравнении' : 'В сравнение'}
                </Button>
            </div>

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
        </article>
    )
}

const CommercialPremises = () => {
    const [filters, setFilters] = useState<ObjectsSearchFilters>(emptyFilters)
    const [appliedFilters, setAppliedFilters] =
        useState<ObjectsSearchFilters>(emptyFilters)
    const [data, setData] = useState<GetRealtyPropertiesResponse>()
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)

    const appliedFiltersKey = useMemo(
        () => JSON.stringify(appliedFilters),
        [appliedFilters],
    )

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)

        void apiGetRealtyProperties({
            page,
            per_page: PAGE_SIZE,
            filters: {
                ...appliedFilters,
                type: ['office'],
            },
        })
            .then((result) => {
                if (!cancelled) {
                    setData(result)
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
    }, [page, appliedFiltersKey])

    const handleSearch = () => {
        setPage(1)
        setAppliedFilters({ ...filters, type: ['office'] })
    }

    const handleReset = () => {
        setFilters(emptyFilters)
        setAppliedFilters(emptyFilters)
        setPage(1)
    }

    return (
        <Container>
            <div className="mb-6">
                <h3>Коммерческие помещения</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Подбор офисных и коммерческих помещений
                </p>
            </div>

            <AdaptiveCard className="bg-white dark:bg-gray-800">
                <ObjectsSearchForm
                    filters={{ ...filters, type: ['office'] }}
                    onChange={(nextFilters) =>
                        setFilters({ ...nextFilters, type: ['office'] })
                    }
                    onSearch={handleSearch}
                    onReset={handleReset}
                    isSearching={isLoading}
                    showTypeFilter={false}
                    commercialFilters
                    multiComplexSelect
                    showFromInvestorFilter
                />

                {isLoading && !data ? (
                    <div className="py-12 text-center">Загрузка...</div>
                ) : (
                    <>
                        {data?.items.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                По заданным параметрам коммерческие помещения не найдены
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {data?.items.map((item) => (
                                    <CommercialCard key={item.id} item={item} />
                                ))}
                            </div>
                        )}

                        {(data?.meta?.last_page ?? 0) > 1 ? (
                            <Pagination
                                className="mt-6"
                                currentPage={page}
                                total={data?.meta?.total ?? 0}
                                pageSize={PAGE_SIZE}
                                onChange={setPage}
                            />
                        ) : null}
                    </>
                )}
            </AdaptiveCard>
        </Container>
    )
}

export default CommercialPremises
