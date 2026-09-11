import { useCallback } from 'react'
import classNames from '@/utils/classNames'
import type {
    CheckboardBuilding,
    CheckboardCellLabel,
    CheckboardProperty,
    CheckboardSection,
    SectionColumn,
} from '../../checkboard.types'
import {
    DIMMED_CELL_CLASS,
    getBuildingMaxFloor,
    getCellLabel,
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

type CheckboardClassicProps = {
    building: CheckboardBuilding
    labelMode: CheckboardCellLabel
    activePropertyIds?: Set<number> | null
    selectedPropertyId?: number | null
    isPropertySelectable?: (property: CheckboardProperty) => boolean
    onPropertySelect?: (propertyId: number) => void
    zoom?: number
    onZoomChange?: (zoom: number) => void
}

const CELL_SIZE_PX = 35
const CELL = 'minmax(35px, 35px)'
const CELL_CLASS = 'size-[35px]'
const FLOOR = '3.25rem'
const GRID_GAP_PX = 6
const FLOOR_ROW_PITCH_PX = CELL_SIZE_PX + GRID_GAP_PX

const buildBlockColumns = (columns: SectionColumn[]) =>
    `${FLOOR} ${columns.map(() => CELL).join(' ')} ${FLOOR}`

type BlockProps = {
    section: CheckboardSection
    columns: SectionColumn[]
    floors: number[]
    labelMode: CheckboardCellLabel
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

const ClassicBlock = ({
    section,
    columns,
    floors,
    labelMode,
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
                        'truncate rounded px-0.5 text-center text-xs font-semibold',
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
            className="inline-grid gap-1.5"
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
                                            CELL_CLASS,
                                            'rounded-lg',
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

                            return (
                                <button
                                    key={property.id}
                                    type="button"
                                    data-property-id={property.id}
                                    disabled={!isSelectable}
                                    className={classNames(
                                        CELL_CLASS,
                                        'relative z-0 flex shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold leading-none',
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
                                    {getCellLabel(property, labelMode)}
                                    {propertyHasSpecialOffer(property) ? (
                                        <span
                                            className="absolute -right-0.5 -top-0.5 max-w-[calc(100%+4px)] truncate rounded px-1 py-px text-[8px] font-bold leading-tight shadow-sm"
                                            style={{
                                                backgroundColor:
                                                    property.special_offers![0]
                                                        .color || '#f59e0b',
                                                color:
                                                    property.special_offers![0]
                                                        .text_color ||
                                                    '#111827',
                                            }}
                                            title={
                                                property.special_offers![0]
                                                    .badge_text ||
                                                property.special_offers![0]
                                                    .name
                                            }
                                        >
                                            %
                                        </span>
                                    ) : null}
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
    labelMode: CheckboardCellLabel
    activePropertyIds?: Set<number> | null
    selectedPropertyId?: number | null
    isPropertySelectable?: (property: CheckboardProperty) => boolean
    onPropertySelect?: (propertyId: number) => void
}

const ClassicSection = ({
    section,
    alignOffsetPx,
    labelMode,
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
            className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 [content-visibility:auto] [contain-intrinsic-size:auto_520px]"
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
                <ClassicBlock
                    section={section}
                    columns={offsetColumns}
                    floors={floors}
                    labelMode={labelMode}
                    activePropertyIds={activePropertyIds}
                    hover={hover}
                    onEmptyHover={onEmptyHover}
                    onPropertyHover={onPropertyHover}
                    selectedPropertyId={selectedPropertyId}
                    isPropertySelectable={isPropertySelectable}
                    onPropertySelect={onPropertySelect}
                />
                <ClassicBlock
                    section={section}
                    columns={stackColumns}
                    floors={floors}
                    labelMode={labelMode}
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

const CheckboardClassic = ({
    building,
    labelMode,
    activePropertyIds,
    selectedPropertyId,
    isPropertySelectable,
    onPropertySelect,
    zoom = 1,
    onZoomChange,
}: CheckboardClassicProps) => {
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
                <ClassicSection
                    key={section.id}
                    section={section}
                    alignOffsetPx={getFloorAlignOffset(
                        section,
                        buildingMaxFloor,
                        FLOOR_ROW_PITCH_PX,
                    )}
                    labelMode={labelMode}
                    activePropertyIds={activePropertyIds}
                    selectedPropertyId={selectedPropertyId}
                    isPropertySelectable={isPropertySelectable}
                    onPropertySelect={onPropertySelect}
                />
            ))}
        </DualHorizontalScroll>
    )
}

export default CheckboardClassic
