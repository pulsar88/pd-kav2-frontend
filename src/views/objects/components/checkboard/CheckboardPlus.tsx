import { useState } from 'react'
import classNames from '@/utils/classNames'
import type {
    CheckboardBuilding,
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
import DualHorizontalScroll from './DualHorizontalScroll'

type CheckboardPlusProps = {
    building: CheckboardBuilding
    activePropertyIds?: Set<number> | null
    selectedPropertyId?: number | null
    onPropertySelect?: (propertyId: number) => void
}

type HoverTarget = { floor: number; columnKey: string } | null

const CELL = 'minmax(160px, 160px)'
const FLOOR = '3.25rem'
const CELL_HEIGHT = 'h-[7.25rem]'
const GRID_GAP_PX = 8
/** h-[7.25rem] (116px) + gap-2 (8px) — шаг строки этажа для выравнивания секций */
const FLOOR_ROW_PITCH_PX = 116 + GRID_GAP_PX

const buildBlockColumns = (columns: SectionColumn[]) =>
    `${FLOOR} ${columns.map(() => CELL).join(' ')} ${FLOOR}`

const isCrosshair = (
    hover: HoverTarget,
    floor: number,
    columnKey: string,
) =>
    Boolean(
        hover && (hover.floor === floor || hover.columnKey === columnKey),
    )

const isExactHover = (
    hover: HoverTarget,
    floor: number,
    columnKey: string,
) =>
    Boolean(
        hover && hover.floor === floor && hover.columnKey === columnKey,
    )

type BlockProps = {
    section: CheckboardSection
    columns: SectionColumn[]
    floors: number[]
    activePropertyIds?: Set<number> | null
    hover: HoverTarget
    onHover: (value: HoverTarget) => void
    selectedPropertyId?: number | null
    onPropertySelect?: (propertyId: number) => void
}

const PlusBlock = ({
    section,
    columns,
    floors,
    activePropertyIds,
    hover,
    onHover,
    selectedPropertyId,
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
                        'truncate rounded px-1 text-center text-[11px] font-medium transition-colors',
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
                                'flex items-center justify-center whitespace-nowrap rounded text-xs font-semibold transition-colors',
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
                            const setCellHover = () =>
                                onHover({
                                    floor,
                                    columnKey: column.key,
                                })

                            if (!property) {
                                const highlighted = isCrosshair(
                                    hover,
                                    floor,
                                    column.key,
                                )
                                return (
                                    <div
                                        key={`${floor}-${column.key}`}
                                        className={classNames(
                                            CELL_HEIGHT,
                                            'rounded-xl transition-colors',
                                            highlighted
                                                ? 'bg-primary/15 dark:bg-primary/20'
                                                : 'bg-gray-50 dark:bg-gray-900/50',
                                        )}
                                        onMouseEnter={setCellHover}
                                    />
                                )
                            }

                            const active =
                                !activePropertyIds ||
                                activePropertyIds.has(property.id)
                            const exact = isExactHover(
                                hover,
                                floor,
                                column.key,
                            )
                            const isSelected =
                                selectedPropertyId === property.id
                            const pricePerSqm =
                                property.area > 0
                                    ? Math.round(property.price / property.area)
                                    : 0

                            return (
                                <button
                                    key={property.id}
                                    type="button"
                                    data-property-id={property.id}
                                    className={classNames(
                                        CELL_HEIGHT,
                                        'relative z-0 flex flex-col overflow-hidden rounded-xl border p-2 text-left transition-[opacity,filter,box-shadow]',
                                        !active && DIMMED_CELL_CLASS,
                                        isSelected &&
                                            'z-[2] shadow-md ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900',
                                        exact &&
                                            !isSelected &&
                                            'z-[1] shadow-md ring-2 ring-primary/70',
                                    )}
                                    style={{
                                        backgroundColor: property.status.color,
                                        color: property.status.text_color,
                                        borderColor:
                                            property.status.accent_color,
                                    }}
                                    onMouseEnter={setCellHover}
                                    onClick={() =>
                                        onPropertySelect?.(property.id)
                                    }
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
                                    {property.type.has_rooms ? (
                                        <p className="mb-1.5 text-[12px] font-medium opacity-90">
                                            {property.type.name}
                                        </p>
                                    ) : (
                                        <p className="mb-1.5 text-[12px] font-medium opacity-90">
                                            {property.status.name}
                                        </p>
                                    )}
                                    <p className="mt-auto text-[18px] font-bold leading-tight">
                                        {formatCheckboardPrice(property.price)}
                                    </p>
                                    <p className="mt-0.5 text-[14px] opacity-85">
                                        {property.area} м² ·{' '}
                                        {formatCheckboardPrice(pricePerSqm)}/м²
                                    </p>
                                </button>
                            )
                        })}
                        <div
                            className={classNames(
                                'flex items-center justify-center whitespace-nowrap rounded text-xs font-semibold transition-colors',
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
    onPropertySelect?: (propertyId: number) => void
}

const PlusSection = ({
    section,
    alignOffsetPx,
    activePropertyIds,
    selectedPropertyId,
    onPropertySelect,
}: SectionProps) => {
    const [hover, setHover] = useState<HoverTarget>(null)
    const floors = getSectionFloors(section)
    const columns = getSectionColumns(section)
    const offsetColumns = columns.filter((column) => column.kind === 'offset')
    const stackColumns = columns.filter((column) => column.kind === 'stack')

    return (
        <div
            className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700"
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
                onMouseLeave={() => setHover(null)}
            >
                <PlusBlock
                    section={section}
                    columns={offsetColumns}
                    floors={floors}
                    activePropertyIds={activePropertyIds}
                    hover={hover}
                    onHover={setHover}
                    selectedPropertyId={selectedPropertyId}
                    onPropertySelect={onPropertySelect}
                />
                <PlusBlock
                    section={section}
                    columns={stackColumns}
                    floors={floors}
                    activePropertyIds={activePropertyIds}
                    hover={hover}
                    onHover={setHover}
                    selectedPropertyId={selectedPropertyId}
                    onPropertySelect={onPropertySelect}
                />
            </div>
        </div>
    )
}

const CheckboardPlus = ({
    building,
    activePropertyIds,
    selectedPropertyId,
    onPropertySelect,
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
        <DualHorizontalScroll>
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
                    onPropertySelect={onPropertySelect}
                />
            ))}
        </DualHorizontalScroll>
    )
}

export default CheckboardPlus
