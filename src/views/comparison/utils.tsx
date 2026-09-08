import type { ReactNode } from 'react'
import type { Premise } from '@/views/objects/types'
import {
    formatArea,
    formatPrice,
    formatRoomsCount,
    getPremisePricePerSqm,
    getPremiseTypeLabel,
} from '@/views/objects/utils'
import type {
    ComparisonCategory,
    ComparisonRowDef,
} from './types'

export const COMPARISON_CATEGORIES: ComparisonCategory[] = [
    { key: 'pricing', title: 'Стоимость и условия' },
    { key: 'general', title: 'Основная информация' },
    { key: 'dimensions', title: 'Площади' },
    { key: 'finishing', title: 'Характеристики и отделка' },
    { key: 'construction', title: 'Сроки и строительство' },
]

export const COMPARISON_ROWS: ComparisonRowDef[] = [
    // Pricing
    {
        id: 'price',
        category: 'pricing',
        label: 'Полная стоимость',
        highlightRule: 'min-is-best',
        getRawValue: (p) => p.price ?? null,
        renderCell: (p, all) => {
            if (p.price === undefined) return '—'
            const isMin =
                all.length > 1 &&
                all.every(
                    (item) =>
                        item.price === undefined ||
                        (p.price != null && p.price <= (item.price ?? Infinity)),
                ) &&
                all.some(
                    (item) =>
                        item.price !== undefined && item.price !== p.price,
                )

            return (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(p.price)}
                    </span>
                    {isMin ? (
                        <span className="mt-0.5 inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Выгодная цена
                        </span>
                    ) : null}
                </div>
            )
        },
    },
    {
        id: 'pricePerSqm',
        category: 'pricing',
        label: 'Цена за м²',
        highlightRule: 'min-is-best',
        getRawValue: (p) => getPremisePricePerSqm(p.price, p.area) ?? null,
        renderCell: (p, all) => {
            const sqPrice = getPremisePricePerSqm(p.price, p.area)
            if (sqPrice === undefined) return '—'

            const isMin =
                all.length > 1 &&
                all.every((item) => {
                    const itemSq = getPremisePricePerSqm(item.price, item.area)
                    return (
                        itemSq === undefined ||
                        (sqPrice != null && sqPrice <= itemSq)
                    )
                }) &&
                all.some((item) => {
                    const itemSq = getPremisePricePerSqm(item.price, item.area)
                    return itemSq !== undefined && itemSq !== sqPrice
                })

            return (
                <div className="flex flex-col">
                    <span>{formatPrice(sqPrice)} / м²</span>
                    {isMin ? (
                        <span className="mt-0.5 inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Меньше за м²
                        </span>
                    ) : null}
                </div>
            )
        },
    },
    {
        id: 'status',
        category: 'pricing',
        label: 'Статус',
        getRawValue: (p) => p.status?.name ?? p.statusName ?? null,
        renderCell: (p) => {
            const statusName = p.status?.name ?? p.statusName
            if (!statusName) return '—'
            const color = p.status?.color ?? p.statusColor ?? '#63cba5'

            return (
                <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: color, color: '#111827' }}
                >
                    {statusName}
                </span>
            )
        },
    },

    // General
    {
        id: 'complexName',
        category: 'general',
        label: 'Жилой комплекс',
        getRawValue: (p) => p.complexName ?? null,
        renderCell: (p) => p.complexName || '—',
    },
    {
        id: 'address',
        category: 'general',
        label: 'Адрес',
        getRawValue: (p) => p.address ?? null,
        renderCell: (p) => p.address || '—',
    },
    {
        id: 'section',
        category: 'general',
        label: 'Секция',
        getRawValue: (p) => p.section ?? null,
        renderCell: (p) => (p.section ? `Секция ${p.section}` : '—'),
    },
    {
        id: 'number',
        category: 'general',
        label: 'Номер',
        getRawValue: (p) => p.number ?? null,
        renderCell: (p) => `№ ${p.number}`,
    },
    {
        id: 'type',
        category: 'general',
        label: 'Тип помещения',
        getRawValue: (p) => getPremiseTypeLabel(p),
        renderCell: (p) => getPremiseTypeLabel(p),
    },
    {
        id: 'rooms',
        category: 'general',
        label: 'Комнатность',
        getRawValue: (p) => p.rooms,
        renderCell: (p) => formatRoomsCount(p.rooms),
    },
    {
        id: 'floor',
        category: 'general',
        label: 'Этаж',
        getRawValue: (p) =>
            p.floorsInBuilding ? `${p.floor}/${p.floorsInBuilding}` : p.floor,
        renderCell: (p) =>
            p.floorsInBuilding
                ? `${p.floor} из ${p.floorsInBuilding}`
                : String(p.floor),
    },

    // Dimensions
    {
        id: 'area',
        category: 'dimensions',
        label: 'Общая площадь',
        highlightRule: 'max-is-best',
        getRawValue: (p) => p.area,
        renderCell: (p, all) => {
            const isMax =
                all.length > 1 &&
                all.every((item) => p.area >= item.area) &&
                all.some((item) => item.area !== p.area)

            return (
                <div className="flex flex-col">
                    <span className="font-medium">{formatArea(p.area)}</span>
                    {isMax ? (
                        <span className="mt-0.5 inline-block text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                            Макс. площадь
                        </span>
                    ) : null}
                </div>
            )
        },
    },
    {
        id: 'goodArea',
        category: 'dimensions',
        label: 'Жилая площадь',
        highlightRule: 'max-is-best',
        getRawValue: (p) => p.goodArea ?? null,
        renderCell: (p) => (p.goodArea ? formatArea(p.goodArea) : '—'),
    },

    // Finishing
    {
        id: 'facing',
        category: 'finishing',
        label: 'Отделка',
        getRawValue: (p) => p.facing ?? null,
        renderCell: (p) => p.facing || '—',
    },
    {
        id: 'material',
        category: 'finishing',
        label: 'Материал стен',
        getRawValue: (p) => p.material ?? null,
        renderCell: (p) => p.material || '—',
    },

    // Construction
    {
        id: 'buildingState',
        category: 'construction',
        label: 'Статус строительства',
        getRawValue: (p) => p.buildingState ?? null,
        renderCell: (p) => p.buildingState || '—',
    },
    {
        id: 'developmentStart',
        category: 'construction',
        label: 'Начало строительства',
        getRawValue: (p) => p.developmentStart ?? null,
        renderCell: (p) => p.developmentStart || '—',
    },
    {
        id: 'deliveryDate',
        category: 'construction',
        label: 'Срок сдачи',
        getRawValue: (p) => p.deliveryDate ?? null,
        renderCell: (p) => p.deliveryDate || '—',
    },
]

export const isRowDifferent = (
    row: ComparisonRowDef,
    premises: Premise[],
): boolean => {
    if (premises.length <= 1) return false
    const values = premises.map((p) => {
        const val = row.getRawValue(p)
        return val === undefined || val === null ? '' : String(val).trim()
    })

    const first = values[0]
    return values.some((val) => val !== first)
}
