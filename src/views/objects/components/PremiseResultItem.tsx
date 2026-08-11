import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi'
import { TbLayoutGrid, TbZoomIn } from 'react-icons/tb'
import classNames from '@/utils/classNames'
import Button from '@/components/ui/Button'
import type { ObjectsSearchFilters, Premise } from '../types'
import { serializeObjectsSearchFilters } from '../filtersQuery'
import {
    finishingLabel,
    formatArea,
    formatCompletionDate,
    formatPrice,
    houseStatusLabel,
    houseTypeLabel,
    premiseTypeLabel,
} from '../utils'

type PremiseResultItemProps = {
    premise: Premise
    onPreviewLayout: () => void
    searchFilters?: ObjectsSearchFilters
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

const PremiseResultItem = ({
    premise,
    onPreviewLayout,
    searchFilters,
}: PremiseResultItemProps) => {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const roomsLabel =
        premise.rooms === 0 ? 'Студия' : `${premise.rooms}-комн.`


    return (
        <div
            className={classNames(
                'overflow-hidden rounded-2xl border transition-colors duration-200',
                open
                    ? 'border-gray-700 bg-gray-900'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
            )}
        >
            <div
                className={classNames(
                    'flex w-full items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4',
                    open ? '' : '',
                )}
            >
                <button
                    type="button"
                    className={classNames(
                        'group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border sm:h-20 sm:w-20',
                        open
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700',
                    )}
                    onClick={onPreviewLayout}
                >
                    <img
                        src={premise.layoutImage}
                        alt={`Планировка ${premise.number}`}
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                        <TbZoomIn className="text-lg" />
                    </span>
                </button>
                <button
                    type="button"
                    className={classNames(
                        'flex min-w-0 flex-1 items-center gap-3 text-left transition-colors',
                        open
                            ? 'hover:bg-transparent'
                            : '',
                    )}
                    onClick={() => setOpen((value) => !value)}
                >
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p
                                className={classNames(
                                    'font-semibold',
                                    open
                                        ? 'text-gray-100'
                                        : 'text-gray-900 dark:text-gray-100',
                                )}
                            >
                                {roomsLabel} · {formatArea(premise.area)}
                            </p>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {premiseTypeLabel[premise.type]}
                            </span>
                        </div>
                        <p
                            className={classNames(
                                'mt-1 truncate text-sm',
                                open
                                    ? 'text-gray-400'
                                    : 'text-gray-500 dark:text-gray-400',
                            )}
                        >
                            {premise.complexName} · {premise.address} · эт.{' '}
                            {premise.floor}/{premise.floorsInBuilding} · №
                            {premise.number}
                        </p>
                        {premise.layout ? (
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                                {premise.layout}
                            </p>
                        ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                        <p
                            className={classNames(
                                'font-semibold',
                                open
                                    ? 'text-gray-100'
                                    : 'text-gray-900 dark:text-gray-100',
                            )}
                        >
                            {formatPrice(premise.price)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {formatPrice(premise.pricePerSqm)} / м²
                        </p>
                    </div>
                    <HiChevronDown
                        className={classNames(
                            'shrink-0 text-xl text-gray-400 transition-transform duration-200',
                            open && 'rotate-180',
                        )}
                    />
                </button>
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
                                <button
                                    type="button"
                                    className="group overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-3 text-left"
                                    onClick={onPreviewLayout}
                                >
                                    <p className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-gray-100">
                                        <span>
                                            Планировка
                                            {premise.layout
                                                ? ` · ${premise.layout}`
                                                : ''}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-primary">
                                            <TbZoomIn />
                                            Увеличить
                                        </span>
                                    </p>
                                    <img
                                        src={premise.layoutImage}
                                        alt={`Планировка помещения №${premise.number}`}
                                        className="mx-auto max-h-[420px] w-full object-contain"
                                    />
                                </button>

                                <div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Detail
                                            label="Тип помещения"
                                            value={
                                                premiseTypeLabel[premise.type]
                                            }
                                        />
                                        <Detail
                                            label="ЖК"
                                            value={premise.complexName}
                                        />
                                        <Detail
                                            label="Адрес"
                                            value={premise.address}
                                        />
                                        <Detail
                                            label="Номер"
                                            value={`№ ${premise.number}`}
                                        />
                                        <Detail
                                            label="Комнат"
                                            value={roomsLabel}
                                        />
                                        <Detail
                                            label="Площадь"
                                            value={formatArea(premise.area)}
                                        />
                                        <Detail
                                            label="Этаж"
                                            value={`${premise.floor} из ${premise.floorsInBuilding}`}
                                        />
                                        <Detail
                                            label="Тип дома"
                                            value={
                                                houseTypeLabel[
                                                    premise.houseType
                                                ]
                                            }
                                        />
                                        <Detail
                                            label="Отделка"
                                            value={
                                                finishingLabel[
                                                    premise.finishing
                                                ]
                                            }
                                        />
                                        <Detail
                                            label="Статус дома"
                                            value={
                                                houseStatusLabel[
                                                    premise.houseStatus
                                                ]
                                            }
                                        />
                                        <Detail
                                            label="Срок сдачи"
                                            value={formatCompletionDate(
                                                premise.deliveryDate,
                                            )}
                                        />
                                        <Detail
                                            label="Высота потолков"
                                            value={
                                                premise.ceilingHeight
                                                    ? `${premise.ceilingHeight} м`
                                                    : undefined
                                            }
                                        />
                                        <Detail
                                            label="Стоимость"
                                            value={formatPrice(premise.price)}
                                        />
                                        <Detail
                                            label="Цена за м²"
                                            value={formatPrice(
                                                premise.pricePerSqm,
                                            )}
                                        />
                                    </div>
                                    {premise.description ? (
                                        <p className="mt-4 text-sm text-gray-300">
                                            {premise.description}
                                        </p>
                                    ) : null}
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
                                                          searchFilters,
                                                          {
                                                              complexId:
                                                                  premise.complexId,
                                                          },
                                                      )
                                                    : new URLSearchParams()

                                                params.set(
                                                    'property_id',
                                                    String(
                                                        premise.checkboardPropertyId,
                                                    ),
                                                )

                                                navigate(
                                                    `/objects/${premise.complexId}?${params.toString()}`,
                                                )
                                            })()
                                        }
                                    >
                                        Открыть на шахматке
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

export default PremiseResultItem
