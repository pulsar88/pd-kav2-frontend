import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi'
import classNames from 'classnames'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { apiGetRealtyPropertiesFilters } from '@/services/ObjectsService'
import { apiGetSpecialOffer } from '@/services/SpecialOffersService'
import RangeInputGroup from './RangeInputGroup'
import type {
    ObjectsSearchFilters,
    RealtyPropertiesFilters,
} from '../types'
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
    /** Опции акций для фильтра (не на шахматке) */
    specialOfferOptions?: Option[]
    /** Показывать фильтр «От инвестора» (на шахматке скрыт) */
    showFromInvestorFilter?: boolean
    onCollapsedChange?: (collapsed: boolean) => void
    onChange: (filters: ObjectsSearchFilters) => void
    onSearch: () => void
    onReset: () => void
}

const FROM_INVESTOR_OPTIONS: Option[] = [
    { value: '1', label: 'Да' },
    { value: '0', label: 'Нет' },
]

const isFilled = (
    value:
        | string
        | number
        | boolean
        | Array<string | number>
        | ''
        | undefined
        | null,
) => {
    if (typeof value === 'boolean') return value
    return Array.isArray(value)
        ? value.length > 0
        : value !== '' && value !== undefined && value !== null
}

/** Сохраняет порядок выбора, а не порядок options в меню */
const optionsInSelectionOrder = (
    selectedValues: string[] | undefined,
    options: Option[],
): Option[] => {
    if (!selectedValues?.length) return []
    const byValue = new Map(options.map((item) => [item.value, item]))
    return selectedValues
        .map((value) => byValue.get(value))
        .filter((item): item is Option => Boolean(item))
}

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
    specialOfferOptions,
    showFromInvestorFilter = true,
    onCollapsedChange,
    onChange,
    onSearch,
    onReset,
}: ObjectsSearchFormProps) => {
    const navigate = useNavigate()
    const [internalCollapsed, setInternalCollapsed] = useState(false)
    const collapsed = collapsedProp ?? internalCollapsed
    const setCollapsed = (value: boolean) => {
        onCollapsedChange?.(value)
        if (collapsedProp === undefined) {
            setInternalCollapsed(value)
        }
    }

    const [filterOptions, setFilterOptions] = useState<
        RealtyPropertiesFilters | undefined
    >()
    const [lockedOfferLabel, setLockedOfferLabel] = useState('')

    useEffect(() => {
        let cancelled = false

        void apiGetRealtyPropertiesFilters().then((result) => {
            if (!cancelled) setFilterOptions(result)
        })

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        const offerId = filters.specialOfferId?.trim()
        if (!offerId) {
            setLockedOfferLabel('')
            return
        }

        let cancelled = false
        const fromOptions = specialOfferOptions?.find(
            (item) => item.value === offerId,
        )
        if (fromOptions?.label) {
            setLockedOfferLabel(fromOptions.label)
            return
        }

        setLockedOfferLabel(`Акция #${offerId}`)
        void apiGetSpecialOffer(offerId)
            .then((offer) => {
                if (!cancelled && offer.name?.trim()) {
                    setLockedOfferLabel(offer.name.trim())
                }
            })
            .catch(() => {
                /* оставляем fallback */
            })

        return () => {
            cancelled = true
        }
    }, [filters.specialOfferId, specialOfferOptions])

    const lockedOfferOption: Option | null = filters.specialOfferId
        ? {
              value: filters.specialOfferId,
              label: lockedOfferLabel || `Акция #${filters.specialOfferId}`,
          }
        : null

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
        () => Object.entries(filters).filter(([, value]) => isFilled(value)).length,
        [filters],
    )

    const hasDraftFilters = hasActiveObjectsSearchFilters(filters)
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
                                            compactMulti
                                            closeMenuOnSelect={false}
                                            isClearable
                                            placeholder="Все ЖК"
                                            options={projectOptions}
                                            value={optionsInSelectionOrder(
                                                filters.realtyProjectIds,
                                                projectOptions,
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
                                        compactMulti
                                        closeMenuOnSelect={false}
                                        isClearable
                                        placeholder="Любой"
                                        options={typeOptions}
                                        value={optionsInSelectionOrder(
                                            filters.type,
                                            typeOptions,
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
                                        compactMulti
                                        closeMenuOnSelect={false}
                                        isClearable
                                        placeholder="Любая"
                                        options={roomSelectOptions}
                                        value={optionsInSelectionOrder(
                                            filters.rooms,
                                            roomSelectOptions,
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
                                {showFromInvestorFilter ? (
                                    <FormItem label="От инвестора">
                                        <Select<Option>
                                            {...selectMenuProps}
                                            isClearable
                                            placeholder="Все"
                                            options={FROM_INVESTOR_OPTIONS}
                                            value={
                                                FROM_INVESTOR_OPTIONS.find(
                                                    (item) =>
                                                        item.value ===
                                                        filters.fromInvestor,
                                                ) ?? null
                                            }
                                            onChange={(option) =>
                                                patch({
                                                    fromInvestor: option
                                                        ? (option.value as
                                                              | '1'
                                                              | '0')
                                                        : '',
                                                })
                                            }
                                        />
                                    </FormItem>
                                ) : null}
                                <FormItem label="Акция">
                                    <div className="relative">
                                        <Select<Option, false>
                                            {...selectMenuProps}
                                            isDisabled={!lockedOfferOption}
                                            isClearable={Boolean(
                                                lockedOfferOption,
                                            )}
                                            isSearchable={false}
                                            openMenuOnClick={false}
                                            openMenuOnFocus={false}
                                            menuIsOpen={false}
                                            options={
                                                lockedOfferOption
                                                    ? [lockedOfferOption]
                                                    : []
                                            }
                                            value={lockedOfferOption}
                                            placeholder="Не выбрана"
                                            components={{
                                                DropdownIndicator: () => null,
                                            }}
                                            onChange={(option) => {
                                                if (!option) {
                                                    patch({
                                                        specialOfferId: '',
                                                    })
                                                }
                                            }}
                                        />
                                        {!lockedOfferOption ? (
                                            <button
                                                type="button"
                                                className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                                                aria-label="Перейти к списку акций"
                                                onClick={() =>
                                                    navigate('/offers')
                                                }
                                            />
                                        ) : null}
                                    </div>
                                </FormItem>
                                {specialOfferOptions &&
                                specialOfferOptions.length > 0 ? (
                                    <FormItem label="Акции">
                                        <Select<Option, true>
                                            {...selectMenuProps}
                                            isMulti
                                            compactMulti
                                            closeMenuOnSelect={false}
                                            isClearable
                                            placeholder="Все акции"
                                            options={specialOfferOptions}
                                            value={optionsInSelectionOrder(
                                                filters.specialOfferIds,
                                                specialOfferOptions,
                                            )}
                                            onChange={(option) =>
                                                patch({
                                                    specialOfferIds:
                                                        (
                                                            option as
                                                                | readonly Option[]
                                                                | null
                                                        )?.map(
                                                            (item) =>
                                                                item.value,
                                                        ) || [],
                                                })
                                            }
                                        />
                                    </FormItem>
                                ) : null}
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
