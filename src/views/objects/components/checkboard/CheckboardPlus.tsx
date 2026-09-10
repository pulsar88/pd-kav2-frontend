import { useCallback } from 'react'
import classNames from '@/utils/classNames'
import type {
    CheckboardBuilding,
    CheckboardProperty,
    CheckboardSection,
    SectionColumn,
} from '../../checkboard.types'
import {
    DIMMED_CELL_CLASS,
    formatCheckboardPrice,
    getBuildingMaxFloor,
    getFloorAlignOffset,
    getPropertyAt,
    getSectionColumns,
    getSectionFloors,
} from '../../checkboardUtils'
import { propertyHasSpecialOffer } from '../../specialOfferUtils'
import DualHorizontalScroll from './DualHorizontalScroll'
import CheckboardSharedPropertyTooltip from './CheckboardSharedPropertyTooltip'
import {
    isCheckboardCrosshair,
    isCheckboardExactHover,
} from './checkboardHoverUtils'
import {
    useCheckboardSectionHover,
    type CheckboardHoverTarget,
} from './useCheckboardSectionHover'

type CheckboardPlusProps = {
    building: CheckboardBuilding
    activePropertyIds?: Set<number> | null
    selectedPropertyId?: number | null
    isPropertySelectable?: (property: CheckboardProperty) => boolean
    onPropertySelect?: (propertyId: number) => void
    zoom?: number
    onZoomChange?: (zoom: number) => void
}

const CELL = 'minmax(180px, 180px)'
const FLOOR = '3.25rem'
const CELL_HEIGHT = 'h-[7.25rem]'
const GRID_GAP_PX = 8
/** h-[7.25rem] (116px) + gap-2 (8px) — шаг строки этажа для выравнивания секций */
const FLOOR_ROW_PITCH_PX = 116 + GRID_GAP_PX

const buildBlockColumns = (columns: SectionColumn[]) =>
    `${FLOOR} ${columns.map(() => CELL).join(' ')} ${FLOOR}`

type BlockProps = {
    section: CheckboardSection
    columns: SectionColumn[]
    floors: number[]
    activePropertyIds?: Set<number> | null
    hover: CheckboardHoverTarget
    onEmptyHover: (floor: number, columnKey: string) => void
    onPropertyHover: (
        property: CheckboardProperty,
        floor: number,
        columnKey: string,
        element: HTMLElement,
    ) => void
    selectedPropertyId?: number | null
    isPropertySelectable?: (property: CheckboardProperty) => boolean
    onPropertySelect?: (propertyId: number) => void
}

const PlusBlock = ({
    section,
    columns,
    floors,
    activePropertyIds,
    hover,
    onEmptyHover,
    onPropertyHover,
    selectedPropertyId,
    isPropertySelectable,
    onPropertySelect,
}: BlockProps) => {
    if (columns.length === 0) return null

    const renderLabels = (position: 'top' | 'bottom') =>
        columns.map((column) => {
            const activeCol = hover?.columnKey === column.key
            return (
                <div
                    key={`${position}-${column.key}`}
                    className={classNames(
                        'truncate rounded px-1 text-center text-[11px] font-medium',
                        activeCol
                            ? 'bg-primary/15 font-semibold text-primary'
                            : 'text-gray-500',
                    )}
                    title={column.label}
                >
                    {column.label}
                </div>
            )
        })

    return (
        <div
            className="inline-grid gap-2"
            style={{ gridTemplateColumns: buildBlockColumns(columns) }}
        >
            <div />
            {renderLabels('top')}
            <div />

            {floors.map((floor) => {
                const rowActive = hover?.floor === floor
                return (
                    <div key={`floor-row-${floor}`} className="contents">
                        <div
                            className={classNames(
                                'flex items-center justify-center whitespace-nowrap rounded text-xs font-semibold',
                                rowActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-gray-500',
                            )}
                        >
                            {floor} эт.
                        </div>
                        {columns.map((column) => {
                            const property = getPropertyAt(
                                section,
                                floor,
                                column,
                            )

                            if (!property) {
                                const highlighted = isCheckboardCrosshair(
                                    hover,
                                    floor,
                                    column.key,
                                )
                                return (
                                    <div
                                        key={`${floor}-${column.key}`}
                                        className={classNames(
                                            CELL_HEIGHT,
                                            'rounded-xl',
                                            highlighted
                                                ? 'bg-primary/15 dark:bg-primary/20'
                                                : 'bg-gray-50 dark:bg-gray-900/50',
                                        )}
                                        onMouseEnter={() =>
                                            onEmptyHover(floor, column.key)
                                        }
                                    />
                                )
                            }

                            const active =
                                !activePropertyIds ||
                                activePropertyIds.has(property.id)
                            const exact = isCheckboardExactHover(
                                hover,
                                floor,
                                column.key,
                            )
                            const isSelected =
                                selectedPropertyId === property.id
                            const isSelectable =
                                !isPropertySelectable ||
                                isPropertySelectable(property)
                            const discountPrice =
                                property.discount_price != null &&
                                property.discount_price > 0
                                    ? property.discount_price
                                    : undefined
                            const hasDiscount = discountPrice != null
                            const hasOffers = propertyHasSpecialOffer(property)
                            const hasPrice =
                                hasDiscount || property.price > 0
                            const displayPrice = hasDiscount
                                ? discountPrice
                                : property.price
                            const pricePerSqm =
                                hasPrice && property.area > 0
                                    ? Math.round(displayPrice / property.area)
                                    : 0

                            return (
                                <button
                                    key={property.id}
                                    type="button"
                                    data-property-id={property.id}
                                    disabled={!isSelectable}
                                    className={classNames(
                                        CELL_HEIGHT,
                                        'relative z-0 flex w-full flex-col overflow-hidden rounded-xl p-2 text-left',
                                        (!active || !isSelectable) &&
                                            DIMMED_CELL_CLASS,
                                        !isSelectable &&
                                            '!cursor-not-allowed opacity-40',
                                        isSelected &&
                                            'z-[2] shadow-md ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900',
                                        exact &&
                                            !isSelected &&
                                            isSelectable &&
                                            'z-[1] shadow-md ring-2 ring-primary/70',
                                    )}
                                    style={{
                                        backgroundColor:
                                            property.status.color,
                                        color: property.status.text_color,
                                    }}
                                    onMouseEnter={(event) =>
                                        onPropertyHover(
                                            property,
                                            floor,
                                            column.key,
                                            event.currentTarget,
                                        )
                                    }
                                    onClick={() => {
                                        if (!isSelectable) return
                                        onPropertySelect?.(property.id)
                                    }}
                                >
                                    <div className="mb-0.5 flex items-start justify-between gap-1">
                                        <span
                                            className={classNames(
                                                'font-bold leading-tight',
                                                property.type.has_rooms
                                                    ? 'text-sm'
                                                    : 'text-[12px]',
                                            )}
                                        >
                                            {property.type.has_rooms
                                                ? property.studio
                                                    ? 'Студия'
                                                    : `${property.rooms_count}-комн.`
                                                : property.type.name}
                                        </span>
                                        <span className="text-[12px] font-semibold uppercase opacity-80">
                                            №{property.number}
                                        </span>
                                    </div>
                                    {hasOffers ? (
                                        <span
                                            className="mb-1 inline-flex max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-bold leading-tight"
                                            style={{
                                                backgroundColor:
                                                    property.special_offers![0]
                                                        .color ||
                                                    'rgba(0,0,0,0.25)',
                                                color:
                                                    property.special_offers![0]
                                                        .text_color ||
                                                    '#ffffff',
                                            }}
                                        >
                                            {property.special_offers![0]
                                                .badge_text ||
                                                property.special_offers![0]
                                                    .name}
                                        </span>
                                    ) : property.type.has_rooms ? (
                                        <p className="mb-1.5 text-[12px] font-medium opacity-90">
                                            {property.type.name}
                                        </p>
                                    ) : (
                                        <p className="mb-1.5 text-[12px] font-medium opacity-90">
                                            {property.status.name}
                                        </p>
                                    )}
                                    <p className="mt-auto text-[18px] font-bold leading-tight">
                                        {hasPrice
                                            ? formatCheckboardPrice(displayPrice)
                                            : '—'}
                                    </p>
                                    {hasDiscount &&
                                    property.price > 0 &&
                                    property.price !== discountPrice ? (
                                        <p className="text-[11px] opacity-75 line-through">
                                            {formatCheckboardPrice(
                                                property.price,
                                            )}
                                        </p>
                                    ) : null}
                                    <p className="mt-0.5 text-[14px] opacity-85">
                                        {property.area > 0
                                            ? `${property.area} м²`
                                            : '—'}
                                        {hasPrice && property.area > 0 ? (
                                            <>
                                                {' · '}
                                                {formatCheckboardPrice(
                                                    pricePerSqm,
                                                )}
                                                /м²
                                            </>
                                        ) : null}
                                    </p>
                                </button>
                            )
                        })}
                        <div
                            className={classNames(
                                'flex items-center justify-center whitespace-nowrap rounded text-xs font-semibold',
                                rowActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-gray-500',
                            )}
                        >
                            {floor} эт.
                        </div>
                    </div>
                )
            })}

            <div />
            {renderLabels('bottom')}
            <div />
        </div>
    )
}

type SectionProps = {
    section: CheckboardSection
    alignOffsetPx: number
    activePropertyIds?: Set<number> | null
    selectedPropertyId?: number | null
    isPropertySelectable?: (property: CheckboardProperty) => boolean
    onPropertySelect?: (propertyId: number) => void
}

const PlusSection = ({
    section,
    alignOffsetPx,
    activePropertyIds,
    selectedPropertyId,
    isPropertySelectable,
    onPropertySelect,
}: SectionProps) => {
    const {
        hover,
        tooltipTarget,
        handleEmptyCellHover,
        handlePropertyCellHover,
        clearSectionHover,
    } = useCheckboardSectionHover()

    const floors = getSectionFloors(section)
    const columns = getSectionColumns(section)
    const offsetColumns = columns.filter((column) => column.kind === 'offset')
    const stackColumns = columns.filter((column) => column.kind === 'stack')

    const onEmptyHover = useCallback(
        (floor: number, columnKey: string) => {
            handleEmptyCellHover(floor, columnKey)
        },
        [handleEmptyCellHover],
    )

    const onPropertyHover = useCallback(
        (
            property: CheckboardProperty,
            floor: number,
            columnKey: string,
            element: HTMLElement,
        ) => {
            handlePropertyCellHover(property, floor, columnKey, element)
        },
        [handlePropertyCellHover],
    )

    return (
        <div
            className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 [content-visibility:auto] [contain-intrinsic-size:auto_640px]"
            style={
                alignOffsetPx > 0
                    ? { marginTop: alignOffsetPx }
                    : undefined
            }
        >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
                <h5 className="text-sm font-semibold">{section.name}</h5>
            </div>
            <div
                className="flex items-start gap-5 p-3"
                onMouseLeave={clearSectionHover}
            >
                <PlusBlock
                    section={section}
                    columns={offsetColumns}
                    floors={floors}
                    activePropertyIds={activePropertyIds}
                    hover={hover}
                    onEmptyHover={onEmptyHover}
                    onPropertyHover={onPropertyHover}
                    selectedPropertyId={selectedPropertyId}
                    isPropertySelectable={isPropertySelectable}
                    onPropertySelect={onPropertySelect}
                />
                <PlusBlock
                    section={section}
                    columns={stackColumns}
                    floors={floors}
                    activePropertyIds={activePropertyIds}
                    hover={hover}
                    onEmptyHover={onEmptyHover}
                    onPropertyHover={onPropertyHover}
                    selectedPropertyId={selectedPropertyId}
                    isPropertySelectable={isPropertySelectable}
                    onPropertySelect={onPropertySelect}
                />
            </div>
            <CheckboardSharedPropertyTooltip
                property={tooltipTarget?.property ?? null}
                referenceElement={tooltipTarget?.element ?? null}
            />
        </div>
    )
}

const CheckboardPlus = ({
    building,
    activePropertyIds,
    selectedPropertyId,
    isPropertySelectable,
    onPropertySelect,
    zoom = 1,
    onZoomChange,
}: CheckboardPlusProps) => {
    const sections = building.sections.filter((section) => {
        const columns = getSectionColumns(section)
        return columns.length > 0
    })
    const buildingMaxFloor = getBuildingMaxFloor(sections)

    if (sections.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
                Нет секций для отображения
            </div>
        )
    }

    return (
        <DualHorizontalScroll zoom={zoom} onZoomChange={onZoomChange}>
            {sections.map((section) => (
                <PlusSection
                    key={section.id}
                    section={section}
                    alignOffsetPx={getFloorAlignOffset(
                        section,
                        buildingMaxFloor,
                        FLOOR_ROW_PITCH_PX,
                    )}
                    activePropertyIds={activePropertyIds}
                    selectedPropertyId={selectedPropertyId}
                    isPropertySelectable={isPropertySelectable}
                    onPropertySelect={onPropertySelect}
                />
            ))}
        </DualHorizontalScroll>
    )
}

export default CheckboardPlus
