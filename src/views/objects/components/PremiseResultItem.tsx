import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi'
import { TbBuildingSkyscraper, TbHeart, TbHeartFilled, TbLayoutGrid, TbZoomIn } from 'react-icons/tb'
import classNames from '@/utils/classNames'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useFavoritesStore } from '@/store/favoritesStore'
import { getApiErrorMessage } from '@/services/auth/authUtils'
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

const PendingRemovalBanner = ({
    startedAt,
    durationMs,
    onCancel,
}: {
    startedAt: number
    durationMs: number
    onCancel: () => void
}) => {
    const [remainingMs, setRemainingMs] = useState(() =>
        Math.max(0, durationMs - (Date.now() - startedAt)),
    )

    useEffect(() => {
        const tick = () => {
            setRemainingMs(Math.max(0, durationMs - (Date.now() - startedAt)))
        }

        tick()
        const interval = window.setInterval(tick, 100)
        return () => window.clearInterval(interval)
    }, [startedAt, durationMs])

    const progress = durationMs > 0 ? remainingMs / durationMs : 0
    const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000))

    return (
        <div className="border-t border-rose-200 bg-rose-50 px-3 py-2.5 dark:border-rose-900/40 dark:bg-rose-950/30 sm:px-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
                <span>Будет удалено из избранного</span>
                <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold tabular-nums">
                        {secondsLeft} сек
                    </span>
                    <Button
                        type="button"
                        size="xs"
                        variant="plain"
                        className="h-7 px-2 text-rose-700 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200"
                        onClick={(event) => {
                            event.stopPropagation()
                            onCancel()
                        }}
                    >
                        Отмена
                    </Button>
                </div>
            </div>
            <div
                className="h-1.5 overflow-hidden rounded-full bg-rose-200 dark:bg-rose-900/50"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
            >
                <div
                    className="h-full rounded-full bg-rose-500 transition-[width] duration-100 ease-linear dark:bg-rose-400"
                    style={{ width: `${progress * 100}%` }}
                />
            </div>
        </div>
    )
}

type PremiseResultItemProps = {
    premise: Premise
    onPreviewLayout: () => void
    searchFilters?: ObjectsSearchFilters
    selectable?: boolean
    selected?: boolean
    onSelectedChange?: (selected: boolean) => void
    onToggleFavorite?: (premise: Premise) => void | Promise<void>
    favoriteState?: boolean
    pendingRemoval?: {
        startedAt: number
        durationMs: number
    }
    onCancelPendingRemoval?: () => void | Promise<void>
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
    onToggleFavorite,
    favoriteState,
    pendingRemoval,
    onCancelPendingRemoval,
}: PremiseResultItemProps) => {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const isFavorite = useFavoritesStore((state) =>
        state.favoriteIds.includes(premise.id),
    )
    const isFavoriteDisplay = favoriteState ?? isFavorite
    const togglePremise = useFavoritesStore((state) => state.togglePremise)
    const typeLabel = getPremiseTypeLabel(premise)
    const pricePerSqm = getPremisePricePerSqm(premise.price, premise.area)
    const coverImage = getPremiseCoverImage(premise)
    const coverImageLabel = premise.layoutImage ? 'Планировка' : 'План этажа'
    const canPreviewImages = hasPremisePreviewImages(premise)

    const premiseMetaLine = [
        `эт. ${premise.floor}${
            premise.floorsInBuilding ? `/${premise.floorsInBuilding}` : ''
        }`,
        `№${premise.number}`,
        premise.layout,
    ]
        .filter(Boolean)
        .join(' · ')

    const expandedPlanBlockCaption = premise.layoutName ?? ''

    const apartmentDetails = (
        <>
            <Detail label="Тип помещения" value={typeLabel} />
            <Detail label="Номер" value={`№ ${premise.number}`} />
            {premise.rooms > 0 ? (
                <Detail
                    label="Комнат"
                    value={formatRoomsCount(premise.rooms)}
                />
            ) : null}
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

    const complexBadge = premise.complexName ? (
        <span className="mb-1.5 inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-sm font-bold leading-tight text-neutral shadow-sm ring-1 ring-primary-deep/30">
            <TbBuildingSkyscraper className="shrink-0 text-base text-neutral" />
            <span className="truncate">{premise.complexName}</span>
        </span>
    ) : null

    const favoriteButton = (
        <Tooltip
            title={
                isFavoriteDisplay
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
                    isFavoriteDisplay ? 'text-rose-500' : 'text-gray-500',
                )}
                icon={isFavoriteDisplay ? <TbHeartFilled /> : <TbHeart />}
                onClick={(event) => {
                    event.stopPropagation()
                    const action =
                        onToggleFavorite ??
                        (() => togglePremise(premise))
                    void Promise.resolve(action(premise)).catch((error) => {
                        toast.push(
                            <Notification type="danger">
                                {getApiErrorMessage(
                                    error,
                                    'Не удалось обновить избранное',
                                )}
                            </Notification>,
                        )
                    })
                }}
            />
        </Tooltip>
    )

    const card = (
        <div
            className={classNames(
                'overflow-hidden rounded-2xl border transition-colors duration-200',
                pendingRemoval
                    ? 'border-rose-300 dark:border-rose-800/70'
                    : open
                      ? 'border-gray-700 bg-gray-900'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                pendingRemoval && !open && 'bg-rose-50/40 dark:bg-rose-950/10',
            )}
        >
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3">
                <div
                    className={classNames(
                        'relative shrink-0 px-3 pt-3 sm:px-0 sm:pt-0',
                        open && 'hidden sm:block',
                    )}
                >
                    {coverImage ? (
                        <button
                            type="button"
                            className={classNames(
                                collapsedPlanClass(open),
                                'group block dark:bg-white',
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
                    <div
                        className={classNames(
                            'absolute right-5 top-5 flex items-center gap-1 sm:hidden',
                            open && 'hidden',
                        )}
                    >
                        {favoriteButton}
                    </div>
                </div>

                <div className="flex w-full min-w-0 flex-1 items-start gap-2 sm:items-center">
                    <button
                        type="button"
                        className="relative flex min-w-0 flex-1 items-start gap-3 px-3 py-3 text-left sm:items-center sm:px-0 sm:py-0"
                        onClick={() => setOpen((value) => !value)}
                    >
                    <div
                        className={classNames(
                            'flex min-w-0 flex-1 flex-col items-start',
                            open && 'pr-10 sm:pr-0',
                        )}
                    >
                        {complexBadge}
                        <p
                            className={classNames(
                                'text-sm font-semibold leading-snug sm:text-base',
                                open
                                    ? 'text-gray-100'
                                    : 'text-gray-900 dark:text-gray-100',
                            )}
                        >
                            {[
                                typeLabel,
                                formatArea(premise.area),
                                formatRoomsCount(premise.rooms),
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                        <p
                            className={classNames(
                                'mt-1 text-sm leading-snug sm:truncate',
                                open
                                    ? 'text-gray-400'
                                    : 'text-gray-500 dark:text-gray-400',
                            )}
                        >
                            {premiseMetaLine}
                        </p>
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
                            'shrink-0 text-xl text-gray-400 transition-transform duration-200',
                            open
                                ? 'absolute bottom-3 right-3 sm:static sm:self-center'
                                : 'ml-auto self-end sm:ml-0 sm:self-center',
                            open && 'rotate-180',
                        )}
                    />
                    </button>
                    <div
                        className={classNames(
                            'hidden shrink-0 self-center sm:block sm:pr-0',
                        )}
                    >
                        {favoriteButton}
                    </div>
                </div>

                <div
                    className={classNames(
                        'absolute right-5 top-5 z-10 flex items-center gap-1 sm:hidden',
                        !open && 'hidden',
                    )}
                >
                    {favoriteButton}
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
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch">
                                {coverImage ? (
                                    <div className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 lg:h-full">
                                        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-700 px-3 py-2.5">
                                            <span className="min-w-0 text-sm font-semibold leading-snug text-gray-100">
                                                {expandedPlanBlockCaption}
                                            </span>
                                            <button
                                                type="button"
                                                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-primary"
                                                onClick={onPreviewLayout}
                                            >
                                                <TbZoomIn />
                                                Увеличить
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            className="group flex flex-1 items-center justify-center p-3 bg-white"
                                            onClick={onPreviewLayout}
                                        >
                                            <img
                                                src={coverImage}
                                                alt={`${coverImageLabel} помещения №${premise.number}`}
                                                className="max-h-[420px] max-w-full object-contain"
                                            />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 lg:h-full">
                                        <div className="shrink-0 border-b border-gray-700 px-3 py-2.5">
                                            <span className="text-sm font-semibold leading-snug text-gray-100">
                                                {expandedPlanBlockCaption}
                                            </span>
                                        </div>
                                        <div className="flex flex-1 items-center justify-center p-3">
                                            <div className="flex min-h-[220px] w-full max-w-full items-center justify-center rounded-xl border border-dashed border-gray-600 bg-gray-900/40">
                                                <LayoutImagePlaceholder />
                                            </div>
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
            {pendingRemoval && onCancelPendingRemoval ? (
                <PendingRemovalBanner
                    startedAt={pendingRemoval.startedAt}
                    durationMs={pendingRemoval.durationMs}
                    onCancel={() => {
                        void Promise.resolve(onCancelPendingRemoval()).catch(
                            (error) => {
                                toast.push(
                                    <Notification type="danger">
                                        {getApiErrorMessage(
                                            error,
                                            'Не удалось отменить удаление',
                                        )}
                                    </Notification>,
                                )
                            },
                        )
                    }}
                />
            ) : null}
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
