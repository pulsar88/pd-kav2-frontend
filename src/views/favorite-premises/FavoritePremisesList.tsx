import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import classNames from 'classnames'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useAuth } from '@/auth'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import Checkbox from '@/components/ui/Checkbox'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import DebouceInput from '@/components/shared/DebouceInput'
import ImageGallery from '@/components/shared/ImageGallery'
import PremiseResultItem from '@/views/objects/components/PremiseResultItem'
import PremisesListSkeleton from '@/views/objects/components/PremisesListSkeleton'
import { createEmptyObjectsSearchFilters } from '@/views/objects/filtersQuery'
import {
    apiGetDefaultCollectionPropertiesPage,
    type FavoriteCollectionPageData,
} from '@/services/RealtyCollectionsService'
import { useFavoritesStore } from '@/store/favoritesStore'
import { TbArrowDown, TbArrowUp, TbSearch } from 'react-icons/tb'
import type { Premise } from '@/views/objects/types'
import {
    formatArea,
    formatPrice,
    getPremisePreviewSlides,
    getPremiseTypeLabel,
    parsePremiseSortKey,
    premiseSortFields,
    toPremiseSortKey,
    type PremiseSortField,
    type PremiseSortState,
} from '@/views/objects/utils'

type Option = { value: string | number; label: string }

type FavoritePremisesListProps = {
    selectedIds: string[]
    onSelectedIdsChange: (ids: string[]) => void
}

const pageSizeOptions = [20, 50, 100].map((number) => ({
    value: number,
    label: `${number} / стр.`,
}))

const emptySearchFilters = createEmptyObjectsSearchFilters()

const REMOVAL_DELAY_MS = 5000

const FavoritePremisesList = ({
    selectedIds,
    onSelectedIdsChange,
}: FavoritePremisesListProps) => {
    const { authenticated } = useAuth()
    const addPremise = useFavoritesStore((state) => state.addPremise)
    const removePremise = useFavoritesStore((state) => state.removePremise)
    const setFavoriteIds = useFavoritesStore((state) => state.setFavoriteIds)
    const [sortKey, setSortKey] = useState<PremiseSortState>(null)
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [search, setSearch] = useState('')
    const [previewIndex, setPreviewIndex] = useState(-1)
    const [previewSlides, setPreviewSlides] = useState<Array<{ src: string }>>(
        [],
    )
    const [data, setData] = useState<FavoriteCollectionPageData | undefined>()
    const [isLoading, setIsLoading] = useState(authenticated)
    const [pendingRemovals, setPendingRemovals] = useState<
        Map<string, number>
    >(() => new Map())
    const removalTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
        new Map(),
    )
    const pendingRemovalIdsRef = useRef(new Set<string>())
    const selectedIdsRef = useRef(selectedIds)
    selectedIdsRef.current = selectedIds

    useEffect(() => {
        if (!authenticated) {
            setData(undefined)
            setIsLoading(false)
            return
        }

        let cancelled = false
        setIsLoading(true)

        void apiGetDefaultCollectionPropertiesPage({
            page: pageIndex,
            per_page: pageSize,
            sort: sortKey ?? undefined,
        })
            .then((result) => {
                if (cancelled) return

                setData(result)

                const pendingIds = removalTimersRef.current
                const currentIds = useFavoritesStore.getState().favoriteIds
                const nextIds = new Set(currentIds)
                let changed = false

                for (const item of result.items) {
                    if (pendingIds.has(item.id) || nextIds.has(item.id)) continue
                    nextIds.add(item.id)
                    changed = true
                }

                if (changed) {
                    setFavoriteIds([...nextIds])
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [authenticated, pageIndex, pageSize, sortKey, setFavoriteIds])

    const premises = data?.items ?? []
    const totalCount = data?.meta.total ?? 0

    useEffect(() => {
        const timers = removalTimersRef.current
        return () => {
            timers.forEach((timer) => clearTimeout(timer))
            timers.clear()
        }
    }, [])

    const clearPendingRemovalState = (premiseId: string) => {
        setPendingRemovals((prev) => {
            if (!prev.has(premiseId)) return prev
            const next = new Map(prev)
            next.delete(premiseId)
            return next
        })
    }

    const cancelDelayedRemoval = (premiseId: string) => {
        const timer = removalTimersRef.current.get(premiseId)
        if (timer) {
            clearTimeout(timer)
            removalTimersRef.current.delete(premiseId)
        }
        pendingRemovalIdsRef.current.delete(premiseId)
        clearPendingRemovalState(premiseId)
    }

    const scheduleDelayedRemoval = (premiseId: string) => {
        cancelDelayedRemoval(premiseId)
        pendingRemovalIdsRef.current.add(premiseId)
        setPendingRemovals((prev) => new Map(prev).set(premiseId, Date.now()))

        const timer = setTimeout(() => {
            removalTimersRef.current.delete(premiseId)

            void (async () => {
                if (!pendingRemovalIdsRef.current.has(premiseId)) {
                    return
                }

                try {
                    await removePremise(premiseId)

                    if (!pendingRemovalIdsRef.current.has(premiseId)) {
                        try {
                            await addPremise(premiseId)
                        } catch (error) {
                            toast.push(
                                <Notification type="danger">
                                    {getApiErrorMessage(
                                        error,
                                        'Не удалось вернуть помещение в избранное',
                                    )}
                                </Notification>,
                            )
                        }
                        return
                    }

                    pendingRemovalIdsRef.current.delete(premiseId)
                    clearPendingRemovalState(premiseId)
                    setData((current) => {
                        if (!current) return current

                        const hasItem = current.items.some(
                            (item) => item.id === premiseId,
                        )
                        if (!hasItem) return current

                        return {
                            ...current,
                            items: current.items.filter(
                                (item) => item.id !== premiseId,
                            ),
                            meta: {
                                ...current.meta,
                                total: Math.max(0, current.meta.total - 1),
                            },
                        }
                    })
                    onSelectedIdsChange(
                        selectedIdsRef.current.filter(
                            (id) => id !== premiseId,
                        ),
                    )
                } catch (error) {
                    pendingRemovalIdsRef.current.delete(premiseId)
                    clearPendingRemovalState(premiseId)
                    toast.push(
                        <Notification type="danger">
                            {getApiErrorMessage(
                                error,
                                'Не удалось обновить избранное',
                            )}
                        </Notification>,
                    )
                }
            })()
        }, REMOVAL_DELAY_MS)

        removalTimersRef.current.set(premiseId, timer)
    }

    const handleCancelPendingRemoval = (premise: Premise) => {
        cancelDelayedRemoval(premise.id)
    }

    const handleToggleFavorite = async (premise: Premise) => {
        if (pendingRemovals.has(premise.id)) {
            cancelDelayedRemoval(premise.id)
            return
        }

        scheduleDelayedRemoval(premise.id)
    }

    const sortState = sortKey ? parsePremiseSortKey(sortKey) : null
    const sortField = sortState?.field
    const sortDir = sortState?.dir

    const filteredList = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return premises

        return premises.filter((premise) => {
            const roomsLabel =
                premise.rooms === 0 ? 'студия' : `${premise.rooms}`
            const haystack = [
                premise.complexName,
                premise.address,
                premise.number,
                getPremiseTypeLabel(premise),
                roomsLabel,
                formatArea(premise.area),
                premise.price !== undefined
                    ? formatPrice(premise.price)
                    : '',
                String(premise.floor),
            ]
                .join(' ')
                .toLowerCase()

            return haystack.includes(query)
        })
    }, [premises, search])

    const pageData = filteredList

    useEffect(() => {
        setPageIndex(1)
    }, [search, sortKey, pageSize])

    const pageSelectedCount = pageData.filter((premise) =>
        selectedIds.includes(premise.id),
    ).length
    const allPageSelected =
        pageData.length > 0 && pageSelectedCount === pageData.length
    const somePageSelected =
        pageSelectedCount > 0 && pageSelectedCount < pageData.length

    const handleSearchChange = (value: string) => {
        setSearch(value)
        setPageIndex(1)
    }

    const handleFieldChange = (field: PremiseSortField) => {
        if (field === sortField && sortDir) {
            setSortKey(
                toPremiseSortKey(field, sortDir === 'asc' ? 'desc' : 'asc'),
            )
            return
        }
        setSortKey(toPremiseSortKey(field, 'asc'))
    }

    const handleResetSort = () => {
        setSortKey(null)
        setPageIndex(1)
    }

    const handleTogglePremise = (premise: Premise, selected: boolean) => {
        if (selected) {
            if (selectedIds.includes(premise.id)) return
            onSelectedIdsChange([...selectedIds, premise.id])
            return
        }
        onSelectedIdsChange(selectedIds.filter((id) => id !== premise.id))
    }

    const handleTogglePage = (checked: boolean) => {
        const pageIds = pageData.map((premise) => premise.id)
        if (checked) {
            onSelectedIdsChange(Array.from(new Set([...selectedIds, ...pageIds])))
            return
        }
        onSelectedIdsChange(selectedIds.filter((id) => !pageIds.includes(id)))
    }

    const handlePreviewLayout = (premise: Premise) => {
        const slides = getPremisePreviewSlides(premise)
        if (slides.length === 0) return
        setPreviewSlides(slides)
        setPreviewIndex(0)
    }

    if (isLoading && !data) {
        return <PremisesListSkeleton count={4} />
    }

    if (totalCount === 0 && !pendingRemovals.size) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center dark:border-gray-600 dark:bg-gray-800/40">
                <p className="mb-2 text-lg font-semibold heading-text">
                    В избранном пока пусто
                </p>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Добавьте помещения из каталога объектов — затем сформируйте
                    коммерческое предложение
                </p>
                <Link to="/objects">
                    <Button variant="solid">Открыть каталог</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="min-w-0">
                <DebouceInput
                    placeholder="Поиск"
                    suffix={<TbSearch className="text-lg" />}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <Checkbox
                        checked={allPageSelected}
                        indeterminate={somePageSelected}
                        className="mb-0"
                        onChange={(value) => handleTogglePage(value)}
                    >
                        Выбрать на странице
                    </Checkbox>
                    <h4 className="mb-0 text-base font-semibold">
                        В избранном: {totalCount}
                    </h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Сортировка:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {premiseSortFields.map((item) => {
                            const active = item.value === sortField

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    title={
                                        active && sortDir
                                            ? sortDir === 'asc'
                                                ? 'По возрастанию · нажмите, чтобы изменить'
                                                : 'По убыванию · нажмите, чтобы изменить'
                                            : undefined
                                    }
                                    className={classNames(
                                        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                                        active
                                            ? 'bg-primary text-neutral'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
                                    )}
                                    onClick={() =>
                                        handleFieldChange(item.value)
                                    }
                                >
                                    <span>{item.label}</span>
                                    {active && sortDir ? (
                                        sortDir === 'asc' ? (
                                            <TbArrowUp className="text-base" />
                                        ) : (
                                            <TbArrowDown className="text-base" />
                                        )
                                    ) : null}
                                </button>
                            )
                        })}
                        <button
                            type="button"
                            disabled={!sortKey}
                            className="rounded-lg px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-default disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={handleResetSort}
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
            </div>

            {pageData.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
                    По поисковому запросу ничего не найдено
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-3">
                        {pageData.map((premise) => {
                            const removalStartedAt =
                                pendingRemovals.get(premise.id)

                            return (
                            <PremiseResultItem
                                key={premise.id}
                                selectable
                                selected={selectedIds.includes(premise.id)}
                                premise={premise}
                                favoriteState={!pendingRemovals.has(premise.id)}
                                searchFilters={emptySearchFilters}
                                pendingRemoval={
                                    removalStartedAt
                                        ? {
                                              startedAt: removalStartedAt,
                                              durationMs: REMOVAL_DELAY_MS,
                                          }
                                        : undefined
                                }
                                onSelectedChange={(selected) =>
                                    handleTogglePremise(premise, selected)
                                }
                                onPreviewLayout={() =>
                                    handlePreviewLayout(premise)
                                }
                                onToggleFavorite={handleToggleFavorite}
                                onCancelPendingRemoval={() =>
                                    handleCancelPendingRemoval(premise)
                                }
                            />
                            )
                        })}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="overflow-x-auto">
                            <Pagination
                                currentPage={pageIndex}
                                pageSize={pageSize}
                                total={totalCount}
                                pagerCount={5}
                                onChange={setPageIndex}
                            />
                        </div>
                        <div
                            className="shrink-0 self-end sm:self-auto"
                            style={{ minWidth: 130 }}
                        >
                            <Select
                                instanceId="favorites-page-size"
                                size="sm"
                                menuPlacement="top"
                                isSearchable={false}
                                value={pageSizeOptions.filter(
                                    (option) => option.value === pageSize,
                                )}
                                options={pageSizeOptions}
                                onChange={(option) => {
                                    const size = (option as Option | null)
                                        ?.value
                                    if (typeof size === 'number') {
                                        setPageSize(size)
                                        setPageIndex(1)
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
            )}

            <ImageGallery
                index={previewIndex}
                slides={previewSlides}
                onClose={() => setPreviewIndex(-1)}
            />
        </div>
    )
}

export default FavoritePremisesList
