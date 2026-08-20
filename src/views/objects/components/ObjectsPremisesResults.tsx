import { useState } from 'react'
import classNames from 'classnames'
import { TbArrowDown, TbArrowUp } from 'react-icons/tb'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import Spinner from '@/components/ui/Spinner'
import ImageGallery from '@/components/shared/ImageGallery'
import type { Premise, ObjectsSearchFilters } from '../types'
import {
    getPremisePreviewSlides,
    parsePremiseSortKey,
    premiseSortFields,
    toPremiseSortKey,
    type PremiseSortField,
    type PremiseSortState,
} from '../utils'
import PremiseResultItem from './PremiseResultItem'

type Option = { value: string | number; label: string }

type ObjectsPremisesResultsProps = {
    results: Premise[]
    total: number
    pageIndex: number
    pageSize: number
    sortKey: PremiseSortState
    isRefreshing?: boolean
    filtersActive?: boolean
    searchFilters?: ObjectsSearchFilters
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    onSortChange: (sortKey: PremiseSortState) => void
}

const pageSizeOptions = [20, 50, 100].map((number) => ({
    value: number,
    label: `${number} / стр.`,
}))

const ObjectsPremisesResults = ({
    results,
    total,
    pageIndex,
    pageSize,
    sortKey,
    isRefreshing = false,
    filtersActive = false,
    searchFilters,
    onPageChange,
    onPageSizeChange,
    onSortChange,
}: ObjectsPremisesResultsProps) => {
    const [previewIndex, setPreviewIndex] = useState(-1)
    const [previewSlides, setPreviewSlides] = useState<
        Array<{ src: string; title?: string }>
    >([])

    const sortState = sortKey ? parsePremiseSortKey(sortKey) : null
    const sortField = sortState?.field
    const sortDir = sortState?.dir

    const handleFieldChange = (field: PremiseSortField) => {
        if (field === sortField && sortDir) {
            onSortChange(
                toPremiseSortKey(field, sortDir === 'asc' ? 'desc' : 'asc'),
            )
            return
        }

        onSortChange(toPremiseSortKey(field, 'asc'))
    }

    const handlePreviewLayout = (premise: Premise) => {
        if (isRefreshing) return

        const slides = getPremisePreviewSlides(premise)
        if (slides.length === 0) return
        setPreviewSlides(slides)
        setPreviewIndex(0)
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h4 className="mb-0 text-base font-semibold">
                    {filtersActive
                        ? `Найдено помещений: ${total}`
                        : `Всего помещений: ${total}`}
                </h4>
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
                                    disabled={isRefreshing}
                                    title={
                                        active && sortDir
                                            ? sortDir === 'asc'
                                                ? 'По возрастанию · нажмите, чтобы изменить'
                                                : 'По убыванию · нажмите, чтобы изменить'
                                            : undefined
                                    }
                                    className={classNames(
                                        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
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
                            disabled={!sortKey || isRefreshing}
                            className="rounded-lg px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-default disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => onSortChange(null)}
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
                    Помещения не найдены
                </div>
            ) : (
                <>
                    <div
                        className={classNames(
                            'relative flex flex-col gap-3 transition-opacity',
                            isRefreshing && 'pointer-events-none opacity-60',
                        )}
                    >
                        {isRefreshing ? (
                            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-white/20 pt-8 dark:bg-gray-900/20">
                                <Spinner size={28} />
                            </div>
                        ) : null}
                        {results.map((premise) => (
                            <PremiseResultItem
                                key={premise.id}
                                premise={premise}
                                searchFilters={searchFilters}
                                onPreviewLayout={() =>
                                    handlePreviewLayout(premise)
                                }
                            />
                        ))}
                    </div>
                    <div
                        className={classNames(
                            'mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                            isRefreshing && 'pointer-events-none opacity-60',
                        )}
                    >
                        <div className="overflow-x-auto">
                            <Pagination
                                currentPage={pageIndex}
                                pageSize={pageSize}
                                total={total}
                                pagerCount={5}
                                onChange={onPageChange}
                            />
                        </div>
                        <div
                            className="shrink-0 self-end sm:self-auto"
                            style={{ minWidth: 130 }}
                        >
                            <Select
                                instanceId="objects-page-size"
                                size="sm"
                                menuPlacement="top"
                                isSearchable={false}
                                isDisabled={isRefreshing}
                                value={pageSizeOptions.filter(
                                    (option) => option.value === pageSize,
                                )}
                                options={pageSizeOptions}
                                onChange={(option) => {
                                    const size = (option as Option | null)
                                        ?.value
                                    if (typeof size === 'number') {
                                        onPageSizeChange(size)
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

export default ObjectsPremisesResults
