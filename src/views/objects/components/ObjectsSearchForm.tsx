import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi'
import useSWR from 'swr'
import classNames from 'classnames'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { apiGetRealtyPropertiesFilters } from '@/services/ObjectsService'
import RangeInputGroup from './RangeInputGroup'
import type { ObjectsSearchFilters, RealtyPropertyTypeCode } from '../types'
import { hasActiveObjectsSearchFilters } from '../filtersQuery'

type Option = { value: string; label: string }

type ObjectsSearchFormProps = {
    filters: ObjectsSearchFilters
    isSearching: boolean
    hasAppliedFilters?: boolean
    collapsed?: boolean
    multiComplexSelect?: boolean
    /** На xl+ кнопки в одной сетке с инпутами, справа */
    desktopActionsInGrid?: boolean
    onCollapsedChange?: (collapsed: boolean) => void
    onChange: (filters: ObjectsSearchFilters) => void
    onSearch: () => void
    onReset: () => void
}

const isFilled = (
    value: string | number | Array<string | number> | '' | undefined | null,
) => (Array.isArray(value) ? value.length > 0 : value !== '' && value !== undefined && value !== null)

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

const ObjectsSearchForm = ({
    filters,
    isSearching,
    hasAppliedFilters = false,
    collapsed: collapsedProp,
    multiComplexSelect = false,
    desktopActionsInGrid = false,
    onCollapsedChange,
    onChange,
    onSearch,
    onReset,
}: ObjectsSearchFormProps) => {
    const [internalCollapsed, setInternalCollapsed] = useState(false)
    const collapsed = collapsedProp ?? internalCollapsed
    const setCollapsed = (value: boolean) => {
        onCollapsedChange?.(value)
        if (collapsedProp === undefined) {
            setInternalCollapsed(value)
        }
    }

    const { data: filterOptions } = useSWR(
        '/api/v2/realty_properties/filters',
        () => apiGetRealtyPropertiesFilters(),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    )

    const projectOptions: Option[] = (filterOptions?.projects ?? []).map(
        (item) => ({
            value: item.id,
            label: item.name,
        }),
    )

    const typeOptions: Option[] = (filterOptions?.realtyTypes ?? []).map(
        (item) => ({
            value: item.value,
            label: item.label,
        }),
    )

    const roomSelectOptions: Option[] = (filterOptions?.realtyRooms ?? []).map(
        (item) => ({
            value: item.value,
            label: item.label,
        }),
    )

    const activeFiltersCount = useMemo(
        () =>
            Object.values(filters).filter((value) => isFilled(value)).length,
        [filters],
    )

    const hasDraftFilters = hasActiveObjectsSearchFilters(filters)
    const canSearch = hasDraftFilters
    const canReset = hasDraftFilters || hasAppliedFilters

    const patch = (partial: Partial<ObjectsSearchFilters>) =>
        onChange({ ...filters, ...partial })

    const actionButtons = (
        <>
            <Button type="button" disabled={!canReset} onClick={onReset}>
                Сбросить
            </Button>
            <Button
                variant="solid"
                type="button"
                loading={isSearching}
                disabled={!canSearch}
                onClick={onSearch}
            >
                Найти помещения
            </Button>
        </>
    )

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div>
                    <h5 className="mb-0.5 text-base font-semibold">
                        Фильтры
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {collapsed
                            ? activeFiltersCount > 0
                                ? `Свернуто · выбрано параметров: ${activeFiltersCount}`
                                : 'Свернуто · параметры не заданы'
                            : 'Общие параметры для списка домов и каталога помещений'}
                    </p>
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
                        key="search-form"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
                            <div className="grid gap-x-4 gap-y-1 xl:grid-cols-2 2xl:grid-cols-4">
                                {multiComplexSelect ? (
                                    <FormItem label="ЖК">
                                        <Select<Option, true>
                                            {...selectMenuProps}
                                            isMulti
                                            closeMenuOnSelect={false}
                                            isClearable
                                            placeholder="Все ЖК"
                                            options={projectOptions}
                                            value={projectOptions.filter(
                                                (item) =>
                                                    (
                                                        filters.realtyProjectIds ||
                                                        []
                                                    ).includes(item.value),
                                            )}
                                            onChange={(option) =>
                                                patch({
                                                    realtyProjectIds: (
                                                        option as readonly Option[] | null
                                                    )?.map(
                                                        (item) => item.value,
                                                    ) || [],
                                                })
                                            }
                                        />
                                    </FormItem>
                                ) : null}
                                <FormItem label="Тип помещения">
                                    <Select<Option, true>
                                        {...selectMenuProps}
                                        isMulti
                                        closeMenuOnSelect={false}
                                        isClearable
                                        placeholder="Любой"
                                        options={typeOptions}
                                        value={typeOptions.filter((item) =>
                                            (filters.type || []).includes(
                                                item.value as RealtyPropertyTypeCode,
                                            ),
                                        )}
                                        onChange={(option) =>
                                            patch({
                                                type: (
                                                    option as readonly Option[] | null
                                                )?.map((item) => item.value) as ObjectsSearchFilters['type'],
                                            })
                                        }
                                    />
                                </FormItem>
                                <FormItem label="Комнатность">
                                    <Select<Option, true>
                                        {...selectMenuProps}
                                        isMulti
                                        closeMenuOnSelect={false}
                                        isClearable
                                        placeholder="Любая"
                                        options={roomSelectOptions}
                                        value={roomSelectOptions.filter((item) =>
                                            (filters.rooms || []).includes(
                                                item.value,
                                            ),
                                        )}
                                        onChange={(option) => {
                                            patch({
                                                rooms: (
                                                    option as readonly Option[] | null
                                                )?.map((item) => item.value) ||
                                                [],
                                            })
                                        }}
                                    />
                                </FormItem>
                                <FormItem label="Этаж">
                                    <RangeInputGroup
                                        fromValue={filters.floorFrom}
                                        toValue={filters.floorTo}
                                        fromPlaceholder="От"
                                        toPlaceholder="До"
                                        onFromChange={(floorFrom) =>
                                            patch({ floorFrom })
                                        }
                                        onToChange={(floorTo) =>
                                            patch({ floorTo })
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
                                <FormItem label="Цена, ₽">
                                    <RangeInputGroup
                                        variant="price"
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
                                {desktopActionsInGrid ? (
                                    <div className="hidden xl:col-span-1 xl:flex xl:flex-nowrap xl:items-end xl:justify-end xl:gap-2 2xl:col-span-3">
                                        {actionButtons}
                                    </div>
                                ) : null}
                            </div>

                            <div
                                className={classNames(
                                    'mt-2 flex flex-wrap justify-end gap-2',
                                    desktopActionsInGrid && 'xl:hidden',
                                )}
                            >
                                {actionButtons}
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

export default ObjectsSearchForm
