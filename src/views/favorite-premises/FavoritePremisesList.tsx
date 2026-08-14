import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import useSWR from 'swr'
import classNames from 'classnames'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import DebouceInput from '@/components/shared/DebouceInput'
import ImageGallery from '@/components/shared/ImageGallery'
import PremiseResultItem from '@/views/objects/components/PremiseResultItem'
import { createEmptyObjectsSearchFilters } from '@/views/objects/filtersQuery'
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
    sortPremises,
    toPremiseSortKey,
    type PremiseSortField,
    type PremiseSortKey,
} from '@/views/objects/utils'
import { enrichPremisesList } from './utils'

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

const FavoritePremisesList = ({
    selectedIds,
    onSelectedIdsChange,
}: FavoritePremisesListProps) => {
    const premises = useFavoritesStore((state) => state.premises)

    const premiseIdsKey = useMemo(
        () =>
            premises
                .map((premise) => premise.id)
                .sort()
                .join(','),
        [premises],
    )

    const { data: enrichedPremises = premises } = useSWR(
        premises.length > 0
            ? ['/favorite-premises/enriched', premiseIdsKey]
            : null,
        () => enrichPremisesList(premises),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const [sortKey, setSortKey] = useState<PremiseSortKey>('price_asc')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [search, setSearch] = useState('')
    const [previewIndex, setPreviewIndex] = useState(-1)
    const [previewSlides, setPreviewSlides] = useState<Array<{ src: string }>>(
        [],
    )

    const { field: sortField, dir: sortDir } = parsePremiseSortKey(sortKey)

    const filteredList = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return enrichedPremises

        return enrichedPremises.filter((premise) => {
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
    }, [enrichedPremises, search])

    const sortedResults = useMemo(
        () => sortPremises(filteredList, sortKey),
        [filteredList, sortKey],
    )

    useEffect(() => {
        setPageIndex(1)
    }, [filteredList, sortKey, pageSize])

    useEffect(() => {
        const next = selectedIds.filter((id) =>
            premises.some((premise) => premise.id === id),
        )
        if (next.length !== selectedIds.length) {
            onSelectedIdsChange(next)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [premises])

    const pageData = useMemo(() => {
        const start = (pageIndex - 1) * pageSize
        return sortedResults.slice(start, start + pageSize)
    }, [sortedResults, pageIndex, pageSize])

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
        if (field === sortField) {
            setSortKey(
                toPremiseSortKey(field, sortDir === 'asc' ? 'desc' : 'asc'),
            )
            return
        }
        setSortKey(toPremiseSortKey(field, 'asc'))
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

    if (!premises.length) {
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
                        В избранном: {filteredList.length}
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
                                        active
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
                                    {active ? (
                                        sortDir === 'asc' ? (
                                            <TbArrowUp className="text-base" />
                                        ) : (
                                            <TbArrowDown className="text-base" />
                                        )
                                    ) : null}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {sortedResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
                    По поисковому запросу ничего не найдено
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-3">
                        {pageData.map((premise) => (
                            <PremiseResultItem
                                key={premise.id}
                                selectable
                                selected={selectedIds.includes(premise.id)}
                                premise={premise}
                                searchFilters={emptySearchFilters}
                                onSelectedChange={(selected) =>
                                    handleTogglePremise(premise, selected)
                                }
                                onPreviewLayout={() =>
                                    handlePreviewLayout(premise)
                                }
                            />
                        ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="overflow-x-auto">
                            <Pagination
                                currentPage={pageIndex}
                                pageSize={pageSize}
                                total={sortedResults.length}
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
