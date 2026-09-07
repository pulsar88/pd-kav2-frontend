import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, UIEvent } from 'react'
import { useNavigate } from 'react-router'
import classNames from 'classnames'
import {
    ImageSlide,
    isImageSlide,
    type RenderSlideProps,
} from 'yet-another-react-lightbox'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Tooltip from '@/components/ui/Tooltip'
import ImageGallery from '@/components/shared/ImageGallery'
import { useFavoritesStore } from '@/store/favoritesStore'
import {
    formatPrice,
    getPremiseCoverImage,
    getPremisePricePerSqm,
    getPremiseTypeLabel,
} from '@/views/objects/utils'
import type { Premise } from '@/views/objects/types'
import {
    TbBuildingSkyscraper,
    TbChevronLeft,
    TbChevronRight,
    TbHeart,
    TbHeartFilled,
    TbLayoutGrid,
    TbPlus,
    TbX,
    TbZoomIn,
} from 'react-icons/tb'
import FloorPlanThumb, {
    FloorPlanPathOverlay,
} from './FloorPlanThumb'
import useResponsive from '@/utils/hooks/useResponsive'
import {
    COMPARISON_CATEGORIES,
    COMPARISON_ROWS,
    isRowDifferent,
} from '../utils'
import type { ComparisonRowDef } from '../types'

type ComparisonMatrixProps = {
    premises: Premise[]
    onlyDifferences: boolean
    selectedIds: string[]
    onToggleSelect: (premiseId: string, selected: boolean) => void
    onRemovePremise: (premiseId: string) => void
}

const ComparisonMatrix = ({
    premises,
    onlyDifferences,
    selectedIds,
    onToggleSelect,
    onRemovePremise,
}: ComparisonMatrixProps) => {
    const navigate = useNavigate()
    const { smaller } = useResponsive()
    const isMobile = smaller.md
    const isFavorite = useFavoritesStore((state) => state.isFavorite)
    const toggleFavorite = useFavoritesStore((state) => state.togglePremise)

    const [hoveredPremiseId, setHoveredPremiseId] = useState<string | null>(null)
    const [previewIndex, setPreviewIndex] = useState(-1)
    const [previewSlides, setPreviewSlides] = useState<Array<{ src: string }>>([])
    const [previewFloorPath, setPreviewFloorPath] = useState<string | null>(null)
    const [previewFloorPlanSize, setPreviewFloorPlanSize] = useState<{
        width: number
        height: number
    } | null>(null)
    const [imageModes, setImageModes] = useState<Record<string, 'layout' | 'floor'>>({})

    const topScrollRef = useRef<HTMLDivElement>(null)
    const topSpacerRef = useRef<HTMLDivElement>(null)
    const tableContainerRef = useRef<HTMLDivElement>(null)
    const syncingScroll = useRef(false)
    const ignoreTopScrollSync = useRef(false)
    const pendingColumnIndexRef = useRef<number | null>(null)
    const scrollEndTimerRef = useRef<number | null>(null)
    const scrollGenerationRef = useRef(0)

    // Sync widths for top horizontal scrollbar
    useEffect(() => {
        const table = tableContainerRef.current
        const spacer = topSpacerRef.current
        if (!table || !spacer) return

        const updateWidth = () => {
            spacer.style.width = `${table.scrollWidth}px`
        }

        updateWidth()
        const observer = new ResizeObserver(updateWidth)
        observer.observe(table)
        return () => observer.disconnect()
    }, [premises])

    useEffect(() => {
        return () => {
            if (scrollEndTimerRef.current != null) {
                window.clearTimeout(scrollEndTimerRef.current)
            }
        }
    }, [])

    const handleTopScroll = (event: UIEvent<HTMLDivElement>) => {
        if (
            !tableContainerRef.current ||
            syncingScroll.current ||
            ignoreTopScrollSync.current
        ) {
            return
        }
        syncingScroll.current = true
        tableContainerRef.current.scrollLeft = event.currentTarget.scrollLeft
        requestAnimationFrame(() => {
            syncingScroll.current = false
        })
    }

    const handleTableScroll = (event: UIEvent<HTMLDivElement>) => {
        if (!topScrollRef.current || syncingScroll.current) return
        syncingScroll.current = true
        topScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
        requestAnimationFrame(() => {
            syncingScroll.current = false
        })
    }

    const getPremiseColumns = () => {
        const container = tableContainerRef.current
        if (!container) return []
        return Array.from(
            container.querySelectorAll<HTMLElement>(
                'thead th[data-premise-id]',
            ),
        )
    }

    const getColumnScrollLeft = (
        columns: HTMLElement[],
        index: number,
    ) => {
        if (columns.length === 0) return 0
        return Math.max(
            0,
            columns[index].offsetLeft - columns[0].offsetLeft,
        )
    }

    const getNearestColumnIndex = (
        columns: HTMLElement[],
        scrollLeft: number,
    ) => {
        if (columns.length === 0) return 0

        let nearestIndex = 0
        let nearestDistance = Number.POSITIVE_INFINITY

        columns.forEach((_, index) => {
            const distance = Math.abs(
                getColumnScrollLeft(columns, index) - scrollLeft,
            )
            if (distance < nearestDistance) {
                nearestDistance = distance
                nearestIndex = index
            }
        })

        return nearestIndex
    }

    const scrollByOneCard = (direction: -1 | 1) => {
        const container = tableContainerRef.current
        if (!container) return

        const columns = getPremiseColumns()
        if (columns.length === 0) return

        const currentIndex =
            pendingColumnIndexRef.current ??
            getNearestColumnIndex(columns, container.scrollLeft)
        const nextIndex = Math.max(
            0,
            Math.min(columns.length - 1, currentIndex + direction),
        )

        if (nextIndex === currentIndex) {
            return
        }

        pendingColumnIndexRef.current = nextIndex
        const targetLeft = getColumnScrollLeft(columns, nextIndex)
        const generation = ++scrollGenerationRef.current

        // Smooth only on the table; top bar follows via handleTableScroll.
        // Block top→table sync during animation so it doesn't interrupt smooth scroll.
        ignoreTopScrollSync.current = true
        container.scrollTo({ left: targetLeft, behavior: 'smooth' })

        if (scrollEndTimerRef.current != null) {
            window.clearTimeout(scrollEndTimerRef.current)
        }

        const finishProgrammaticScroll = () => {
            if (scrollGenerationRef.current !== generation) return
            ignoreTopScrollSync.current = false
            pendingColumnIndexRef.current = null
            scrollEndTimerRef.current = null
        }

        const onScrollEnd = () => {
            container.removeEventListener('scrollend', onScrollEnd)
            finishProgrammaticScroll()
        }
        container.addEventListener('scrollend', onScrollEnd)

        scrollEndTimerRef.current = window.setTimeout(() => {
            container.removeEventListener('scrollend', onScrollEnd)
            finishProgrammaticScroll()
        }, 450)
    }

    const minPrice = useMemo(() => {
        const prices = premises
            .map((p) => p.price)
            .filter((p): p is number => p !== undefined && p > 0)
        return prices.length > 1 ? Math.min(...prices) : null
    }, [premises])

    const visibleCategories = useMemo(() => {
        return COMPARISON_CATEGORIES.map((category) => {
            const rows = COMPARISON_ROWS.filter(
                (r) => r.category === category.key,
            )
            const filteredRows = onlyDifferences
                ? rows.filter((r) => isRowDifferent(r, premises))
                : rows

            return {
                ...category,
                rows: filteredRows,
            }
        }).filter((category) => category.rows.length > 0)
    }, [onlyDifferences, premises])

    const openLayoutPreview = (premise: Premise) => {
        const cover = getPremiseCoverImage(premise)
        if (!cover) return
        setPreviewFloorPath(null)
        setPreviewFloorPlanSize(null)
        setPreviewSlides([{ src: cover }])
        setPreviewIndex(0)
    }

    const openFloorPreview = (premise: Premise) => {
        if (!premise.floorPlanImage) return
        setPreviewFloorPath(premise.floorPath || null)
        setPreviewFloorPlanSize(null)
        setPreviewSlides([{ src: premise.floorPlanImage }])
        setPreviewIndex(0)

        // Предзагрузка плана, чтобы получить натуральные размеры картинки:
        // floorPath задан в координатах исходного изображения, поэтому
        // viewBox оверлея должен совпадать с naturalWidth/naturalHeight
        if (premise.floorPath) {
            const img = new window.Image()
            img.onload = () => {
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    setPreviewFloorPlanSize({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                    })
                }
            }
            img.src = premise.floorPlanImage
        }
    }

    // Делегирование наведения: подсветка колонки не сбрасывается при
    // переходе курсора между ячейками одного столбца (исключает мерцание)
    const handleTableMouseOver = (event: ReactMouseEvent<HTMLTableElement>) => {
        const target = event.target as HTMLElement | null
        const cell = target?.closest?.('[data-premise-id]') as
            | HTMLElement
            | null
        const premiseId = cell?.dataset.premiseId
        if (premiseId) {
            setHoveredPremiseId((prev) => (prev === premiseId ? prev : premiseId))
        }
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900">
            {/* Top Synchronized Horizontal Scrollbar */}
            <div
                ref={topScrollRef}
                className="checkboard-scroll border-b border-gray-100 bg-gray-50/80 overflow-x-auto overflow-y-hidden dark:border-gray-800 dark:bg-gray-800/60"
                style={{ height: 12 }}
                onScroll={handleTopScroll}
            >
                <div ref={topSpacerRef} style={{ height: 1 }} />
            </div>

            {/* Mobile Controls Bar (столбец «Параметры» на мобильных скрыт —
                навигация по колонкам остаётся здесь) */}
            {isMobile ? (
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {premises.length}{' '}
                        {premises.length === 1 ? 'помещение' : 'помещения'}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            title="Прокрутить влево"
                            className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            onClick={() => scrollByOneCard(-1)}
                        >
                            <TbChevronLeft className="text-sm" />
                        </button>
                        <button
                            type="button"
                            title="Прокрутить вправо"
                            className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            onClick={() => scrollByOneCard(1)}
                        >
                            <TbChevronRight className="text-sm" />
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Scrollable Table Area */}
            <div
                ref={tableContainerRef}
                className="overflow-x-auto checkboard-scroll"
                onScroll={handleTableScroll}
            >
                <table
                    className="w-full border-collapse text-left text-sm"
                    onMouseOver={handleTableMouseOver}
                    onMouseLeave={() => setHoveredPremiseId(null)}
                >
                    {/* Sticky Table Header */}
                    <thead className="border-b border-gray-200 bg-gray-50/95 backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/95">
                        <tr>
                            {/* Sticky Leftmost Column */}
                            {!isMobile ? (
                                <th className="sticky left-0 z-20 w-24 min-w-[92px] max-w-[112px] sm:w-56 sm:min-w-[200px] sm:max-w-[240px] bg-gray-50/95 p-1.5 sm:p-4 text-xs font-semibold uppercase tracking-wider text-gray-500 backdrop-blur-md dark:bg-gray-800/95 dark:text-gray-400">
                                    <div className="flex flex-col gap-2">
                                        <div className="text-[11px] sm:text-xs">
                                            Параметры
                                        </div>
                                        <div className="text-[10px] sm:text-[11px] font-normal text-gray-400 dark:text-gray-500">
                                            {premises.length}{' '}
                                            {premises.length === 1
                                                ? 'помещение'
                                                : 'помещения'}
                                        </div>

                                        {/* Horizontal Quick Scroll Buttons */}
                                        <div className="mt-1 flex items-center gap-1">
                                            <button
                                                type="button"
                                                title="Прокрутить влево"
                                                className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                onClick={() =>
                                                    scrollByOneCard(-1)
                                                }
                                            >
                                                <TbChevronLeft className="text-sm" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Прокрутить вправо"
                                                className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                onClick={() =>
                                                    scrollByOneCard(1)
                                                }
                                            >
                                                <TbChevronRight className="text-sm" />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            ) : null}

                            {/* Premise Columns */}
                            {premises.map((premise) => {
                                const mode = premise.floorPlanImage
                                    ? imageModes[premise.id] || 'layout'
                                    : 'layout'
                                const cover = getPremiseCoverImage(premise)
                                const isBestPrice =
                                    minPrice !== null &&
                                    premise.price !== undefined &&
                                    premise.price === minPrice
                                const baseStatus =
                                    premise.baseStatus ??
                                    premise.status?.base_status
                                const isUnavailableForFixation =
                                    baseStatus === 30 || baseStatus === 40
                                const typeLabel = getPremiseTypeLabel(premise)
                                const pricePerSqm = getPremisePricePerSqm(
                                    premise.price,
                                    premise.area,
                                )
                                const isSelectedForCP = selectedIds.includes(
                                    premise.id,
                                )

                                return (
                                    <th
                                        key={premise.id}
                                        data-premise-id={premise.id}
                                        className={classNames(
                                            'w-40 min-w-[150px] max-w-[220px] sm:w-64 sm:min-w-[240px] sm:max-w-[300px] p-2.5 sm:p-4 align-top font-normal transition-colors duration-150',
                                            hoveredPremiseId === premise.id
                                                ? 'bg-gray-100/70 dark:bg-gray-800/60'
                                                : '',
                                        )}
                                    >
                                        <div className="relative flex flex-col gap-2.5">
                                            {/* Top action row: Checkbox for CP + Favorite + Remove */}
                                            <div className="flex items-center justify-between gap-1">
                                                <Checkbox
                                                    checked={isSelectedForCP}
                                                    className="mb-0 text-xs"
                                                    onChange={(checked) =>
                                                        onToggleSelect(
                                                            premise.id,
                                                            Boolean(checked),
                                                        )
                                                    }
                                                >
                                                    <span className="text-[11px] sm:text-xs font-semibold">
                                                        В КП
                                                    </span>
                                                </Checkbox>

                                                <div className="flex items-center gap-1">
                                                    <Tooltip
                                                        title={
                                                            isFavorite(
                                                                premise.id,
                                                            )
                                                                ? 'Убрать из избранного'
                                                                : 'В избранное'
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            className={classNames(
                                                                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                                                                isFavorite(
                                                                    premise.id,
                                                                )
                                                                    ? 'text-rose-500 hover:text-rose-600'
                                                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                                                            )}
                                                            onClick={() =>
                                                                void toggleFavorite(
                                                                    premise,
                                                                )
                                                            }
                                                        >
                                                            {isFavorite(
                                                                premise.id,
                                                            ) ? (
                                                                <TbHeartFilled className="text-base" />
                                                            ) : (
                                                                <TbHeart className="text-base" />
                                                            )}
                                                        </button>
                                                    </Tooltip>

                                                    <Tooltip title="Удалить из сравнения">
                                                        <button
                                                            type="button"
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                                            onClick={() =>
                                                                onRemovePremise(
                                                                    premise.id,
                                                                )
                                                            }
                                                        >
                                                            <TbX className="text-base" />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </div>

                                            {/* Mode Selector: Планировка vs На этаже */}
                                            <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                                                <button
                                                    type="button"
                                                    className={classNames(
                                                        'flex-1 rounded-md py-0.5 text-[10px] sm:text-xs font-medium transition-all text-center',
                                                        mode === 'layout'
                                                            ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
                                                    )}
                                                    onClick={() =>
                                                        setImageModes(
                                                            (prev) => ({
                                                                ...prev,
                                                                [premise.id]:
                                                                    'layout',
                                                            }),
                                                        )
                                                    }
                                                >
                                                    Планировка
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!premise.floorPlanImage}
                                                    title={
                                                        premise.floorPlanImage
                                                            ? undefined
                                                            : 'План этажа недоступен'
                                                    }
                                                    className={classNames(
                                                        'flex-1 rounded-md py-0.5 text-[10px] sm:text-xs font-medium transition-all text-center',
                                                        mode === 'floor'
                                                            ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
                                                        !premise.floorPlanImage &&
                                                            'cursor-not-allowed opacity-45 hover:text-gray-500 dark:hover:text-gray-400',
                                                    )}
                                                    onClick={() =>
                                                        setImageModes(
                                                            (prev) => ({
                                                                ...prev,
                                                                [premise.id]:
                                                                    'floor',
                                                            }),
                                                        )
                                                    }
                                                >
                                                    На этаже
                                                </button>
                                            </div>

                                            {/* Image container */}
                                            {mode === 'floor' &&
                                            premise.floorPlanImage ? (
                                                <FloorPlanThumb
                                                    src={premise.floorPlanImage}
                                                    path={premise.floorPath}
                                                    alt={`План этажа, №${premise.number}`}
                                                    className="h-28 sm:h-36 p-1.5"
                                                    onPreview={() =>
                                                        openFloorPreview(premise)
                                                    }
                                                />
                                            ) : cover ? (
                                                <div
                                                    className="group relative flex h-28 sm:h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-white"
                                                    onClick={() =>
                                                        openLayoutPreview(
                                                            premise,
                                                        )
                                                    }
                                                >
                                                    <img
                                                        src={cover}
                                                        alt={`Планировка №${premise.number}`}
                                                        className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                                                    />
                                                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                                                        <TbZoomIn className="text-xl" />
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex h-28 sm:h-36 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800/40">
                                                    <TbLayoutGrid className="text-2xl opacity-60" />
                                                    <span className="text-[10px] text-gray-500">
                                                        Нет фото
                                                    </span>
                                                </div>
                                            )}

                                            {/* Complex & Number */}
                                            <div>
                                                {premise.complexName ? (
                                                    <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                        <TbBuildingSkyscraper className="text-xs shrink-0" />
                                                        <span className="truncate max-w-[140px] sm:max-w-[200px]">
                                                            {premise.complexName}
                                                        </span>
                                                    </span>
                                                ) : null}
                                                <h5 className="mb-0 text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                                    {typeLabel} · №{premise.number}
                                                </h5>
                                                <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                    {premise.floor} этаж
                                                    {premise.section
                                                        ? ` · Секция ${premise.section}`
                                                        : ''}
                                                </p>
                                            </div>

                                            {/* Price block */}
                                            <div className="rounded-xl bg-gray-100/70 p-2 sm:p-2.5 dark:bg-gray-800/60">
                                                <div className="flex flex-wrap items-baseline justify-between gap-1">
                                                    <span className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-gray-100">
                                                        {premise.price !==
                                                        undefined
                                                            ? formatPrice(
                                                                  premise.price,
                                                              )
                                                            : '—'}
                                                    </span>
                                                    {isBestPrice ? (
                                                        <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                                                            Лучшая цена
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {pricePerSqm !== undefined ? (
                                                    <p className="mt-0.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                        {formatPrice(
                                                            pricePerSqm,
                                                        )}{' '}
                                                        / м²
                                                    </p>
                                                ) : null}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col gap-1 pt-0.5">
                                                {!isUnavailableForFixation ? (
                                                    <Button
                                                        type="button"
                                                        size="xs"
                                                        variant="solid"
                                                        className="w-full text-xs"
                                                        icon={<TbPlus />}
                                                        onClick={() => {
                                                            const params =
                                                                new URLSearchParams(
                                                                    {
                                                                        create: '1',
                                                                    },
                                                                )
                                                            if (
                                                                premise.complexId
                                                            ) {
                                                                params.set(
                                                                    'complexId',
                                                                    premise.complexId,
                                                                )
                                                            }
                                                            params.set(
                                                                'propertyId',
                                                                premise.id,
                                                            )
                                                            params.set(
                                                                'apartmentNumber',
                                                                premise.number,
                                                            )
                                                            if (
                                                                premise.rooms >
                                                                0
                                                            ) {
                                                                params.set(
                                                                    'rooms',
                                                                    String(
                                                                        premise.rooms,
                                                                    ),
                                                                )
                                                            }
                                                            navigate(
                                                                `/fixations?${params.toString()}`,
                                                            )
                                                        }}
                                                    >
                                                        Фиксация
                                                    </Button>
                                                ) : null}

                                                {premise.complexId ? (
                                                    <Button
                                                        type="button"
                                                        size="xs"
                                                        variant="default"
                                                        className="w-full text-xs"
                                                        icon={<TbLayoutGrid />}
                                                        onClick={() =>
                                                            navigate(
                                                                `/objects/${premise.complexId}?property_id=${premise.id}&tab=premises`,
                                                            )
                                                        }
                                                    >
                                                        На шахматке
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {visibleCategories.map((category) => (
                            <CategorySection
                                key={category.key}
                                categoryTitle={category.title}
                                rows={category.rows}
                                premises={premises}
                                hoveredPremiseId={hoveredPremiseId}
                                mobileMode={isMobile}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <ImageGallery
                index={previewIndex}
                slides={previewSlides}
                render={
                    previewFloorPath
                        ? {
                              slide: (props: RenderSlideProps) => {
                                  if (!isImageSlide(props.slide)) return null
                                  return (
                                      <div
                                          style={{
                                              position: 'relative',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              ...(previewFloorPlanSize
                                                  ? {
                                                        maxWidth: `min(${previewFloorPlanSize.width}px, 100%)`,
                                                        maxHeight: `min(${previewFloorPlanSize.height}px, 100%)`,
                                                        aspectRatio: `${previewFloorPlanSize.width} / ${previewFloorPlanSize.height}`,
                                                    }
                                                  : null),
                                          }}
                                      >
                                          <ImageSlide
                                              {...props}
                                              style={
                                                  previewFloorPlanSize
                                                      ? {
                                                            display: 'block',
                                                            width: '100%',
                                                            height: 'auto',
                                                            maxWidth: undefined,
                                                            maxHeight: undefined,
                                                        }
                                                      : undefined
                                              }
                                          />
                                          {previewFloorPlanSize ? (
                                              <FloorPlanPathOverlay
                                                  path={previewFloorPath}
                                                  width={
                                                      previewFloorPlanSize.width
                                                  }
                                                  height={
                                                      previewFloorPlanSize.height
                                                  }
                                              />
                                          ) : null}
                                      </div>
                                  )
                              },
                          }
                        : undefined
                }
                onClose={() => {
                    setPreviewIndex(-1)
                    setPreviewFloorPath(null)
                    setPreviewFloorPlanSize(null)
                }}
            />
        </div>
    )
}

type CategorySectionProps = {
    categoryTitle: string
    rows: ComparisonRowDef[]
    premises: Premise[]
    hoveredPremiseId: string | null
    mobileMode: boolean
}

const CategorySection = ({
    categoryTitle,
    rows,
    premises,
    hoveredPremiseId,
    mobileMode,
}: CategorySectionProps) => {
    return (
        <>
            {/* Category Header Row */}
            <tr className="border-t-2 border-b border-gray-200 bg-gray-100/70 font-semibold dark:border-gray-700 dark:bg-gray-800/80">
                <td
                    colSpan={mobileMode ? premises.length : premises.length + 1}
                    className="px-2 sm:px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                    {categoryTitle}
                </td>
            </tr>

            {/* Parameter Rows */}
            {rows.map((row) => {
                const diff = isRowDifferent(row, premises)

                return (
                    <tr
                        key={row.id}
                        className={classNames(
                            'transition-colors duration-150',
                            diff
                                ? 'bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/10 dark:hover:bg-amber-950/20'
                                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50',
                        )}
                    >
                        {/* Parameter Label (Sticky Left Column) — на мобильных
                            колонка скрыта, подпись выводится внутри ячейки */}
                        {!mobileMode ? (
                            <td className="sticky left-0 z-10 w-24 min-w-[92px] max-w-[112px] sm:w-56 sm:min-w-[200px] sm:max-w-[240px] bg-white/95 px-1.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs font-medium text-gray-600 backdrop-blur-md dark:bg-gray-900/95 dark:text-gray-300">
                                <div className="flex items-center gap-1.5">
                                    {diff ? (
                                        <span
                                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                                            title="Параметры отличаются"
                                        />
                                    ) : null}
                                    <span className="break-words leading-tight">
                                        {row.label}
                                    </span>
                                </div>
                            </td>
                        ) : null}

                        {/* Premise Values */}
                        {premises.map((premise) => (
                            <td
                                key={premise.id}
                                data-premise-id={premise.id}
                                className={classNames(
                                    'px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 transition-colors duration-150 dark:text-gray-100',
                                    mobileMode
                                        ? 'min-w-[170px] align-top'
                                        : '',
                                    hoveredPremiseId === premise.id
                                        ? diff
                                            ? 'bg-amber-50/80 dark:bg-amber-950/30'
                                            : 'bg-gray-100/70 dark:bg-gray-800/60'
                                        : '',
                                )}
                            >
                                {mobileMode ? (
                                    <div className="mb-1 flex items-center gap-1.5">
                                        {diff ? (
                                            <span
                                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                                                title="Параметры отличаются"
                                            />
                                        ) : null}
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                            {row.label}
                                        </span>
                                    </div>
                                ) : null}
                                {row.renderCell(premise, premises)}
                            </td>
                        ))}
                    </tr>
                )
            })}
        </>
    )
}

export default ComparisonMatrix
