import { Link } from 'react-router'
import type { ReactNode } from 'react'
import classNames from '@/utils/classNames'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import {
    TbCheck,
    TbFileDownload,
    TbMinus,
    TbPlus,
    TbTrash,
} from 'react-icons/tb'

type ComparisonHeaderProps = {
    totalCount: number
    selectedCount: number
    allSelected: boolean
    someSelected: boolean
    onSelectAllChange: (selected: boolean) => void
    onlyDifferences: boolean
    onOnlyDifferencesChange: (value: boolean) => void
    onClearAll: () => void
    onGenerateProposal: () => void
    isGeneratingProposal: boolean
}

const FilterChip = ({
    active,
    onClick,
    children,
    title,
    className,
}: {
    active: boolean
    onClick: () => void
    children: ReactNode
    title?: string
    className?: string
}) => {
    const chip = (
        <button
            type="button"
            className={classNames(
                'inline-flex h-9 min-w-0 items-center gap-1.5 rounded-xl border px-2 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm',
                active
                    ? 'border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/15 dark:text-primary'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700/80',
                className,
            )}
            onClick={onClick}
        >
            {children}
        </button>
    )

    if (!title) return chip

    return <Tooltip title={title}>{chip}</Tooltip>
}

const ComparisonHeader = ({
    totalCount,
    selectedCount,
    allSelected,
    someSelected,
    onSelectAllChange,
    onlyDifferences,
    onOnlyDifferencesChange,
    onClearAll,
    onGenerateProposal,
    isGeneratingProposal,
}: ComparisonHeaderProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-center gap-2.5">
                    <h3 className="mb-0 text-xl font-bold">
                        Сравнение помещений
                    </h3>
                    {totalCount > 0 ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {totalCount}
                        </span>
                    ) : null}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Сравнивайте характеристики, планировки, расположение на
                    этаже и цены выбранных помещений
                </p>
            </div>

            {totalCount > 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:p-3.5">
                    {/*
                      До 1350px — две полноценные строки (фильтры / действия).
                      От 1350px — одна строка: фильтры слева, действия справа.
                    */}
                    <div className="flex flex-col gap-3 min-[1350px]:flex-row min-[1350px]:items-center min-[1350px]:justify-between min-[1350px]:gap-4">
                        <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2">
                            <FilterChip
                                active={allSelected || someSelected}
                                className="min-w-0 flex-1 justify-center sm:flex-none sm:justify-start"
                                title="Выбрать все помещения для коммерческого предложения"
                                onClick={() => onSelectAllChange(!allSelected)}
                            >
                                <span
                                    className={classNames(
                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[11px]',
                                        allSelected
                                            ? 'border-primary bg-primary text-neutral'
                                            : someSelected
                                              ? 'border-primary bg-primary/20 text-primary'
                                              : 'border-gray-300 bg-white text-transparent dark:border-gray-500 dark:bg-gray-900',
                                    )}
                                >
                                    {allSelected ? (
                                        <TbCheck className="text-xs" />
                                    ) : someSelected ? (
                                        <TbMinus className="text-xs" />
                                    ) : null}
                                </span>
                                <span className="truncate">
                                    <span>Выбрать все</span>
                                </span>
                                <span
                                    className={classNames(
                                        'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] tabular-nums sm:text-xs',
                                        allSelected || someSelected
                                            ? 'bg-primary/15 text-primary'
                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
                                    )}
                                >
                                    {selectedCount}/{totalCount}
                                </span>
                            </FilterChip>

                            <FilterChip
                                active={onlyDifferences}
                                className="min-w-0 flex-1 justify-center sm:flex-none sm:justify-start"
                                title="Скрыть параметры с одинаковыми значениями"
                                onClick={() =>
                                    onOnlyDifferencesChange(!onlyDifferences)
                                }
                            >
                                <span
                                    className={classNames(
                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[11px]',
                                        onlyDifferences
                                            ? 'border-primary bg-primary text-neutral'
                                            : 'border-gray-300 bg-white text-transparent dark:border-gray-500 dark:bg-gray-900',
                                    )}
                                >
                                    {onlyDifferences ? (
                                        <TbCheck className="text-xs" />
                                    ) : null}
                                </span>
                                <span className="truncate">
                                    <span>Только различия</span>
                                </span>
                            </FilterChip>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center min-[1350px]:w-auto">
                            <Button
                                type="button"
                                size="sm"
                                variant="solid"
                                disabled={selectedCount === 0}
                                className="w-full sm:min-w-0 sm:flex-1 min-[1350px]:w-auto min-[1350px]:flex-none"
                                icon={<TbFileDownload className="text-lg" />}
                                loading={isGeneratingProposal}
                                onClick={onGenerateProposal}
                            >
                                <span className="truncate">
                                    Сформировать КП
                                    {selectedCount > 0
                                        ? ` (${selectedCount})`
                                        : ''}
                                </span>
                            </Button>

                            <Link
                                to="/objects"
                                className="inline-flex w-full min-w-0 sm:flex-1 min-[1350px]:w-auto min-[1350px]:flex-none"
                            >
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    className="w-full"
                                    icon={<TbPlus className="text-lg" />}
                                >
                                    Добавить еще
                                </Button>
                            </Link>

                            <Button
                                type="button"
                                size="sm"
                                variant="plain"
                                className="w-full border border-rose-600 text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:w-auto dark:border-rose-400 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                                icon={<TbTrash className="text-lg" />}
                                onClick={onClearAll}
                            >
                                Очистить
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default ComparisonHeader
