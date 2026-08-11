import { useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import { TbArrowDown, TbArrowUp } from 'react-icons/tb'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import ImageGallery from '@/components/shared/ImageGallery'
import type { ObjectsSearchFilters, Premise } from '../types'
import {
    parsePremiseSortKey,
    premiseSortFields,
    sortPremises,
    toPremiseSortKey,
    type PremiseSortField,
    type PremiseSortKey,
} from '../utils'
import PremiseResultItem from './PremiseResultItem'

type Option = { value: string | number; label: string }

type ObjectsPremisesResultsProps = {
    results: Premise[]
    searchFilters: ObjectsSearchFilters
}

const pageSizeOptions = [20, 50, 100].map((number) => ({
    value: number,
    label: `${number} / стр.`,
}))

const ObjectsPremisesResults = ({
    results,
    searchFilters,
}: ObjectsPremisesResultsProps) => {
    const [sortKey, setSortKey] = useState<PremiseSortKey>('price_asc')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [previewIndex, setPreviewIndex] = useState(-1)
    const [previewSlides, setPreviewSlides] = useState<Array<{ src: string }>>(
        [],
    )

    const { field: sortField, dir: sortDir } = parsePremiseSortKey(sortKey)

    const sortedResults = useMemo(
        () => sortPremises(results, sortKey),
        [results, sortKey],
    )

    useEffect(() => {
        setPageIndex(1)
    }, [results, sortKey, pageSize])

    const pageData = useMemo(() => {
        const start = (pageIndex - 1) * pageSize
        return sortedResults.slice(start, start + pageSize)
    }, [sortedResults, pageIndex, pageSize])

    const handleFieldChange = (field: PremiseSortField) => {
        if (field === sortField) {
            setSortKey(
                toPremiseSortKey(field, sortDir === 'asc' ? 'desc' : 'asc'),
            )
            return
        }
        setSortKey(toPremiseSortKey(field, 'asc'))
    }

    const handlePreviewLayout = (premise: Premise) => {
        setPreviewSlides([{ src: premise.layoutImage }])
        setPreviewIndex(0)
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h4 className="mb-0 text-base font-semibold">
                    Найдено помещений: {results.length}
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
                                            ? 'bg-primary text-white'
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

            {results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
                    По заданным параметрам ничего не найдено
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-3">
                        {pageData.map((premise) => (
                            <PremiseResultItem
                                key={premise.id}
                                premise={premise}
                                onPreviewLayout={() =>
                                    handlePreviewLayout(premise)
                                }
                                searchFilters={searchFilters}
                            />
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <Pagination
                            currentPage={pageIndex}
                            pageSize={pageSize}
                            total={sortedResults.length}
                            onChange={setPageIndex}
                        />
                        <div style={{ minWidth: 130 }}>
                            <Select
                                instanceId="objects-page-size"
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

export default ObjectsPremisesResults
