import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi'
import { TbHeart, TbHeartFilled, TbLayoutGrid, TbZoomIn } from 'react-icons/tb'
import classNames from '@/utils/classNames'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Tooltip from '@/components/ui/Tooltip'
import { useFavoritesStore } from '@/store/favoritesStore'
import type { ObjectsSearchFilters, Premise } from '../types'
import { serializeObjectsSearchFilters, withoutComplexFilters, appendObjectsCatalogTab } from '../filtersQuery'
import {
    finishingLabel,
    formatArea,
    formatPrice,
    formatRoomsCount,
    getPremiseCoverImage,
    getPremisePricePerSqm,
    getPremiseTypeLabel,
    hasPremisePreviewImages,
    houseStatusLabel,
    houseTypeLabel,
} from '../utils'

type PremiseResultItemProps = {
    premise: Premise
    onPreviewLayout: () => void
    searchFilters?: ObjectsSearchFilters
    selectable?: boolean
    selected?: boolean
    onSelectedChange?: (selected: boolean) => void
}


const Detail = ({
    label,
    value,
}: {
    label: string
    value: string | number | undefined
}) => (
    <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-100">{value || '—'}</p>
    </div>
)

const collapsedPlanClass = (open: boolean) =>
    classNames(
        'relative overflow-hidden rounded-xl border',
        open
            ? 'border-gray-700 bg-gray-800'
            : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700',
        'aspect-[4/3] w-full max-h-52 sm:aspect-auto sm:h-20 sm:w-20 sm:max-h-none sm:shrink-0',
    )

const LayoutImagePlaceholder = ({
    compact = false,
}: {
    compact?: boolean
}) => (
    <div
        className={classNames(
            'flex h-full w-full flex-col items-center justify-center text-gray-400',
            compact ? 'gap-0.5' : 'gap-2 p-4',
        )}
    >
        <TbLayoutGrid
            className={classNames(compact ? 'text-xl' : 'text-3xl', 'opacity-60')}
        />
        <span
            className={classNames(
                'text-center text-gray-500',
                compact ? 'text-[10px] leading-tight' : 'text-xs',
            )}
        >
            Нет планировки
        </span>
    </div>
)

const PremiseResultItem = ({
    premise,
    onPreviewLayout,
    searchFilters,
    selectable = false,
    selected = false,
    onSelectedChange,
}: PremiseResultItemProps) => {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const isFavorite = useFavoritesStore((state) =>
        state.premises.some((item) => item.id === premise.id),
    )
    const togglePremise = useFavoritesStore((state) => state.togglePremise)
    const typeLabel = getPremiseTypeLabel(premise)
    const pricePerSqm = getPremisePricePerSqm(premise.price, premise.area)
    const coverImage = getPremiseCoverImage(premise)
    const coverImageLabel = premise.layoutImage ? 'Планировка' : 'План этажа'
    const canPreviewImages = hasPremisePreviewImages(premise)

    const locationParts = [
        `эт. ${premise.floor}${
            premise.floorsInBuilding ? `/${premise.floorsInBuilding}` : ''
        }`,
        `№${premise.number}`,
    ].filter(Boolean)

    const apartmentDetails = (
        <>
            <Detail label="Тип помещения" value={typeLabel} />
            <Detail label="Номер" value={`№ ${premise.number}`} />
            <Detail label="Комнат" value={formatRoomsCount(premise.rooms)} />
            <Detail label="Площадь" value={formatArea(premise.area)} />
            {premise.goodArea !== undefined ? (
                <Detail
                    label="Жилая площадь"
                    value={formatArea(premise.goodArea)}
                />
            ) : null}
            <Detail
                label="Этаж"
                value={
                    premise.floorsInBuilding
                        ? `${premise.floor} из ${premise.floorsInBuilding}`
                        : String(premise.floor)
                }
            />
            {premise.finishing ? (
                <Detail
                    label="Отделка"
                    value={finishingLabel[premise.finishing]}
                />
            ) : null}
            {premise.ceilingHeight ? (
                <Detail
                    label="Высота потолков"
                    value={`${premise.ceilingHeight} м`}
                />
            ) : null}
            {premise.price !== undefined ? (
                <Detail
                    label="Стоимость"
                    value={formatPrice(premise.price)}
                />
            ) : null}
            {pricePerSqm !== undefined ? (
                <Detail
                    label="Цена за м²"
                    value={formatPrice(pricePerSqm)}
                />
            ) : null}
        </>
    )

    const houseDetails = (
        <>
            {premise.complexName ? (
                <Detail label="Название" value={premise.complexName} />
            ) : null}
            {premise.section ? (
                <Detail label="Секция" value={premise.section} />
            ) : null}
            {premise.address ? (
                <div className="col-span-2">
                    <Detail label="Адрес" value={premise.address} />
                </div>
            ) : null}
            {premise.material ? (
                <Detail label="Материал" value={premise.material} />
            ) : null}
            {premise.facing ? (
                <Detail label="Отделка" value={premise.facing} />
            ) : null}
            {premise.houseType ? (
                <Detail
                    label="Тип дома"
                    value={houseTypeLabel[premise.houseType]}
                />
            ) : null}
            {premise.houseStatus || premise.buildingState ? (
                <Detail
                    label="Статус дома"
                    value={
                        premise.houseStatus
                            ? houseStatusLabel[premise.houseStatus]
                            : premise.buildingState
                    }
                />
            ) : null}
            {premise.developmentStart ? (
                <Detail
                    label="Начало строительства"
                    value={premise.developmentStart}
                />
            ) : null}
            {premise.deliveryDate ? (
                <Detail label="Срок сдачи" value={premise.deliveryDate} />
            ) : null}
        </>
    )

    const hasHouseDetails =
        Boolean(premise.complexName) ||
        Boolean(premise.section) ||
        Boolean(premise.address) ||
        Boolean(premise.material) ||
        Boolean(premise.facing) ||
        Boolean(premise.houseType) ||
        Boolean(premise.houseStatus) ||
        Boolean(premise.buildingState) ||
        Boolean(premise.developmentStart) ||
        Boolean(premise.deliveryDate)

    const priceBlock = (
        <>
            {premise.price !== undefined ? (
                <p
                    className={classNames(
                        'font-semibold leading-snug',
                        open
                            ? 'text-gray-100'
                            : 'text-gray-900 dark:text-gray-100',
                    )}
                >
                    {formatPrice(premise.price)}
                </p>
            ) : null}
            {pricePerSqm !== undefined ? (
                <p
                    className={classNames(
                        'text-xs leading-snug',
                        open
                            ? 'text-gray-400'
                            : 'text-gray-500 dark:text-gray-400',
                    )}
                >
                    {formatPrice(pricePerSqm)} / м²
                </p>
            ) : null}
        </>
    )

    const hasPriceInfo =
        premise.price !== undefined || pricePerSqm !== undefined

    const favoriteButton = (
        <Tooltip
            title={
                isFavorite
                    ? 'Убрать из избранного'
                    : 'Добавить в избранное'
            }
        >
            <Button
                type="button"
                size="sm"
                variant="plain"
                className={classNames(
                    'bg-white/90 shadow-sm backdrop-blur-sm dark:bg-gray-900/90 sm:bg-transparent sm:shadow-none sm:backdrop-blur-none',
                    isFavorite ? 'text-rose-500' : 'text-gray-500',
                )}
                icon={isFavorite ? <TbHeartFilled /> : <TbHeart />}
                onClick={(event) => {
                    event.stopPropagation()
                    togglePremise(premise)
                }}
            />
        </Tooltip>
    )

    const card = (
        <div
            className={classNames(
                'overflow-hidden rounded-2xl border transition-colors duration-200',
                open
                    ? 'border-gray-700 bg-gray-900'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3">
                <div className="relative shrink-0 px-3 pt-3 sm:px-0 sm:pt-0">
                    {coverImage ? (
                        <button
                            type="button"
                            className={classNames(
                                collapsedPlanClass(open),
                                'group block',
                            )}
                            onClick={onPreviewLayout}
                        >
                            <img
                                src={coverImage}
                                alt={`${coverImageLabel} ${premise.number}`}
                                className="h-full w-full object-contain p-2 sm:p-1"
                                loading="lazy"
                            />
                            {canPreviewImages ? (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                                    <TbZoomIn className="text-xl sm:text-lg" />
                                </span>
                            ) : null}
                        </button>
                    ) : (
                        <Tooltip title="Нет планировки">
                            <div
                                className={classNames(
                                    collapsedPlanClass(open),
                                    'cursor-default',
                                )}
                            >
                                <div className="flex h-full sm:hidden">
                                    <LayoutImagePlaceholder />
                                </div>
                                <div className="hidden h-full sm:flex">
                                    <LayoutImagePlaceholder compact />
                                </div>
                            </div>
                        </Tooltip>
                    )}
                    <div className="absolute right-5 top-5 flex items-center gap-1 sm:hidden">
                        {favoriteButton}
                    </div>
                </div>

                <div className="flex w-full min-w-0 flex-1 items-start gap-2 sm:items-center">
                    <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3 text-left sm:items-center sm:px-0 sm:py-0"
                        onClick={() => setOpen((value) => !value)}
                    >
                    <div className="min-w-0 flex-1">
                        <p
                            className={classNames(
                                'text-sm font-semibold leading-snug sm:text-base',
                                open
                                    ? 'text-gray-100'
                                    : 'text-gray-900 dark:text-gray-100',
                            )}
                        >
                            {typeLabel} · {formatArea(premise.area)} ·{' '}
                            {formatRoomsCount(premise.rooms)}
                        </p>
                        {!open && premise.complexName ? (
                            <span className="mt-1.5 inline-flex max-w-full truncate rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {premise.complexName}
                            </span>
                        ) : null}
                        <p
                            className={classNames(
                                'mt-1 text-sm leading-snug sm:truncate',
                                open
                                    ? 'text-gray-400'
                                    : 'text-gray-500 dark:text-gray-400',
                            )}
                        >
                            {locationParts.join(' · ')}
                        </p>
                        {premise.layout ? (
                            <p
                                className={classNames(
                                    'mt-0.5 text-xs leading-snug sm:truncate',
                                    open
                                        ? 'text-gray-500'
                                        : 'text-gray-500 dark:text-gray-400',
                                )}
                            >
                                {premise.layout}
                            </p>
                        ) : null}
                        {hasPriceInfo ? (
                            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 sm:hidden">
                                {priceBlock}
                            </div>
                        ) : null}
                    </div>
                    {hasPriceInfo ? (
                        <div className="hidden shrink-0 text-right sm:block">
                            {priceBlock}
                        </div>
                    ) : null}
                    <HiChevronDown
                        className={classNames(
                            'mt-0.5 shrink-0 text-xl text-gray-400 transition-transform duration-200',
                            open && 'rotate-180',
                        )}
                    />
                    </button>
                    <div className="hidden shrink-0 self-center pr-3 sm:block sm:pr-0">
                        {favoriteButton}
                    </div>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {open ? (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-gray-700 px-4 py-4">
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                                {coverImage ? (
                                    <button
                                        type="button"
                                        className="group overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-3 text-left"
                                        onClick={onPreviewLayout}
                                    >
                                        <p className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-gray-100">
                                            <span>
                                                {coverImageLabel}
                                                {premise.layout && coverImageLabel === 'Планировка'
                                                    ? ` · ${premise.layout}`
                                                    : ''}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-primary">
                                                <TbZoomIn />
                                                Увеличить
                                            </span>
                                        </p>
                                        <img
                                            src={coverImage}
                                            alt={`${coverImageLabel} помещения №${premise.number}`}
                                            className="mx-auto max-h-[420px] w-full object-contain"
                                        />
                                    </button>
                                ) : (
                                    <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-3">
                                        <p className="mb-2 text-sm font-semibold text-gray-100">
                                            Планировка
                                            {premise.layout
                                                ? ` · ${premise.layout}`
                                                : ''}
                                        </p>
                                        <div className="mx-auto flex min-h-[220px] max-w-full items-center justify-center rounded-xl border border-dashed border-gray-600 bg-gray-900/40">
                                            <LayoutImagePlaceholder />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="grid gap-4 grid-cols-2">
                                        {apartmentDetails}
                                    </div>

                                    {hasHouseDetails ? (
                                        <div className="mt-5 border-t border-gray-700 pt-5">
                                            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                Дом
                                            </p>
                                            <div className="grid gap-4 grid-cols-2">
                                                {houseDetails}
                                            </div>
                                        </div>
                                    ) : null}
                                    {premise.description ? (
                                        <p className="mt-4 text-sm text-gray-300">
                                            {premise.description}
                                        </p>
                                    ) : null}
                                    {premise.complexId ? (
                                        <Button
                                            type="button"
                                            variant="solid"
                                            size="sm"
                                            className="mt-4"
                                            icon={<TbLayoutGrid />}
                                            onClick={() =>
                                                (() => {
                                                    const params = searchFilters
                                                        ? serializeObjectsSearchFilters(
                                                              withoutComplexFilters(
                                                                  searchFilters,
                                                              ),
                                                          )
                                                        : new URLSearchParams()

                                                    params.set(
                                                        'property_id',
                                                        premise.id,
                                                    )
                                                    appendObjectsCatalogTab(
                                                        params,
                                                        'premises',
                                                    )

                                                    navigate(
                                                        `/objects/${premise.complexId}?${params.toString()}`,
                                                    )
                                                })()
                                            }
                                        >
                                            Открыть на шахматке
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )

    if (!selectable) {
        return card
    }

    return (
        <div className="relative flex sm:items-center sm:gap-3">
            <div
                className="absolute left-3 top-3 z-10 rounded-lg bg-white/90 shadow-sm backdrop-blur-sm dark:bg-gray-900/90 sm:static sm:shrink-0 sm:self-center sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                role="presentation"
            >
                <Checkbox
                    checked={selected}
                    className="mb-0"
                    onChange={(value) => onSelectedChange?.(value)}
                />
            </div>
            <div className="min-w-0 flex-1">{card}</div>
        </div>
    )
}

export default PremiseResultItem
