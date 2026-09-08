import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi'
import classNames from 'classnames'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import RangeInputGroup from '../RangeInputGroup'
import type { CheckboardFilters } from '../../checkboard.types'

type Option = { value: string; label: string }

type CheckboardFiltersBarProps = {
    filters: CheckboardFilters
    typeOptions: Option[]
    total: number
    onChange: (filters: CheckboardFilters) => void
    onApply: () => void
    onReset: () => void
}

const roomsOptions: Option[] = [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4+' },
]

const selectMenuProps = {
    menuPortalTarget:
        typeof document !== 'undefined' ? document.body : undefined,
    menuPosition: 'fixed' as const,
    styles: {
        menuPortal: (base: Record<string, unknown>) => ({
            ...base,
            zIndex: 80,
        }),
    },
}

const numberInput = (
    value: number | '',
    placeholder: string,
    onChange: (value: number | '') => void,
) => (
    <Input
        type="number"
        placeholder={placeholder}
        className="[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value ?? ''}
        onChange={(e) =>
            onChange(e.target.value === '' ? '' : Number(e.target.value))
        }
    />
)

const CheckboardFiltersBar = ({
    filters,
    typeOptions,
    total,
    onChange,
    onApply,
    onReset,
}: CheckboardFiltersBarProps) => {
    const [collapsed, setCollapsed] = useState(true)

    const activeCount = useMemo(
        () =>
            Object.entries(filters).filter(
                ([key, value]) =>
                    key !== 'statusCode' &&
                    value !== '' &&
                    value !== undefined &&
                    value !== null,
            ).length,
        [filters],
    )

    const patch = (partial: Partial<CheckboardFilters>) =>
        onChange({ ...filters, ...partial })

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => setCollapsed((value) => !value)}
            >
                <div className="min-w-0 flex-1">
                    <h5 className="mb-2 text-base font-semibold">Фильтры</h5>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                            Всего:{' '}
                            <span className="ml-1 text-base tabular-nums">
                                {total}
                            </span>
                        </span>
                        {collapsed && activeCount > 0 ? (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                параметров: {activeCount}
                            </span>
                        ) : null}
                    </div>
                </div>
                <HiChevronDown
                    className={classNames(
                        'shrink-0 text-xl text-gray-400 transition-transform duration-200',
                        !collapsed && 'rotate-180',
                    )}
                />
            </button>

            <AnimatePresence initial={false}>
                {!collapsed ? (
                    <motion.div
                        key="checkboard-filters"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
                            <div className="grid gap-x-4 gap-y-1 xl:grid-cols-2 2xl:grid-cols-4">
                                <FormItem label="Тип помещения">
                                    <Select
                                        isClearable
                                        placeholder="Любой"
                                        options={typeOptions}
                                        value={
                                            typeOptions.find(
                                                (item) =>
                                                    item.value ===
                                                    filters.typeCode,
                                            ) || null
                                        }
                                        onChange={(option) =>
                                            patch({
                                                typeCode:
                                                    (option as Option | null)
                                                        ?.value || '',
                                            })
                                        }
                                        {...selectMenuProps}
                                    />
                                </FormItem>
                                <FormItem label="Комнат">
                                    <Select
                                        isClearable
                                        placeholder="Любое"
                                        options={roomsOptions}
                                        value={
                                            roomsOptions.find(
                                                (item) =>
                                                    item.value ===
                                                    (filters.rooms === ''
                                                        ? ''
                                                        : String(filters.rooms)),
                                            ) || null
                                        }
                                        onChange={(option) => {
                                            const selected =
                                                option as Option | null
                                            patch({
                                                rooms:
                                                    selected == null
                                                        ? ''
                                                        : Number(selected.value),
                                            })
                                        }}
                                        {...selectMenuProps}
                                    />
                                </FormItem>
                                <FormItem label="Стоимость, ₽">
                                    <RangeInputGroup
                                        fromValue={filters.priceFrom}
                                        toValue={filters.priceTo}
                                        fromPlaceholder="От"
                                        toPlaceholder="До"
                                        onFromChange={(priceFrom) =>
                                            patch({ priceFrom })
                                        }
                                        onToChange={(priceTo) =>
                                            patch({ priceTo })
                                        }
                                    />
                                </FormItem>
                                <FormItem label="Площадь, м²">
                                    <RangeInputGroup
                                        fromValue={filters.areaFrom}
                                        toValue={filters.areaTo}
                                        fromPlaceholder="От"
                                        toPlaceholder="До"
                                        onFromChange={(areaFrom) =>
                                            patch({ areaFrom })
                                        }
                                        onToChange={(areaTo) =>
                                            patch({ areaTo })
                                        }
                                    />
                                </FormItem>
                                <FormItem label="₽/м² от">
                                    {numberInput(
                                        filters.pricePerSqmFrom,
                                        'От',
                                        (pricePerSqmFrom) =>
                                            patch({ pricePerSqmFrom }),
                                    )}
                                </FormItem>
                                <FormItem label="₽/м² до">
                                    {numberInput(
                                        filters.pricePerSqmTo,
                                        'До',
                                        (pricePerSqmTo) =>
                                            patch({ pricePerSqmTo }),
                                    )}
                                </FormItem>
                            </div>

                            <div className="mt-2 flex flex-wrap justify-end gap-2">
                                <Button type="button" onClick={onReset}>
                                    Сбросить
                                </Button>
                                <Button
                                    variant="solid"
                                    type="button"
                                    onClick={onApply}
                                >
                                    Применить
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

export default CheckboardFiltersBar
