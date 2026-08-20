import { useState } from 'react'
import classNames from '@/utils/classNames'
import type {
    CheckboardBuilding,
    CheckboardCellLabel,
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
import DualHorizontalScroll from './DualHorizontalScroll'
import CheckboardPropertyCellTooltip from './CheckboardPropertyCellTooltip'

type CheckboardClassicProps = {
    building: CheckboardBuilding
    labelMode: CheckboardCellLabel
    activePropertyIds?: Set<number> | null
    selectedPropertyId?: number | null
    onPropertySelect?: (propertyId: number) => void
}

type HoverTarget = { floor: number; columnKey: string } | null

const CELL_SIZE_PX = 35
const CELL = 'minmax(35px, 35px)'
const CELL_CLASS = 'size-[35px]'
const FLOOR = '3.25rem'
const GRID_GAP_PX = 6
const FLOOR_ROW_PITCH_PX = CELL_SIZE_PX + GRID_GAP_PX

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
    labelMode: CheckboardCellLabel
    activePropertyIds?: Set<number> | null
    hover: HoverTarget
    onHover: (value: HoverTarget) => void
    selectedPropertyId?: number | null
    onPropertySelect?: (propertyId: number) => void
}

const ClassicBlock = ({
    section,
    columns,
    floors,
    labelMode,
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
                        'truncate rounded px-0.5 text-center text-xs font-semibold transition-colors',
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
                                            CELL_CLASS,
                                            'rounded-lg transition-colors',
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

                            return (
                                <CheckboardPropertyCellTooltip
                                    key={property.id}
                                    property={property}
                                    wrapperClass="flex shrink-0"
                                >
                                    <button
                                        type="button"
                                        data-property-id={property.id}
                                        className={classNames(
                                            CELL_CLASS,
                                            'relative z-0 flex shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold leading-none transition-[opacity,filter,box-shadow]',
                                            !active && DIMMED_CELL_CLASS,
                                            isSelected &&
                                                'z-[2] shadow-md ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900',
                                            exact &&
                                                !isSelected &&
                                                'z-[1] shadow-md ring-2 ring-primary/70',
                                        )}
                                        style={{
                                            backgroundColor:
                                                property.status.color,
                                            color: property.status.text_color,
                                        }}
                                        onMouseEnter={setCellHover}
                                        onClick={() =>
                                            onPropertySelect?.(property.id)
                                        }
                                    >
                                        {getCellLabel(property, labelMode)}
                                    </button>
                                </CheckboardPropertyCellTooltip>
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
    labelMode: CheckboardCellLabel
    activePropertyIds?: Set<number> | null
    selectedPropertyId?: number | null
    onPropertySelect?: (propertyId: number) => void
}

const ClassicSection = ({
    section,
    alignOffsetPx,
    labelMode,
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
                <ClassicBlock
                    section={section}
                    columns={offsetColumns}
                    floors={floors}
                    labelMode={labelMode}
                    activePropertyIds={activePropertyIds}
                    hover={hover}
                    onHover={setHover}
                    selectedPropertyId={selectedPropertyId}
                    onPropertySelect={onPropertySelect}
                />
                <ClassicBlock
                    section={section}
                    columns={stackColumns}
                    floors={floors}
                    labelMode={labelMode}
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

const CheckboardClassic = ({
    building,
    labelMode,
    activePropertyIds,
    selectedPropertyId,
    onPropertySelect,
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
        <DualHorizontalScroll>
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
                    onPropertySelect={onPropertySelect}
                />
            ))}
        </DualHorizontalScroll>
    )
}

export default CheckboardClassic
