import type { CheckboardHoverTarget } from './useCheckboardSectionHover'

export const isCheckboardCrosshair = (
    hover: CheckboardHoverTarget,
    floor: number,
    columnKey: string,
) =>
    Boolean(
        hover && (hover.floor === floor || hover.columnKey === columnKey),
    )

export const isCheckboardExactHover = (
    hover: CheckboardHoverTarget,
    floor: number,
    columnKey: string,
) =>
    Boolean(
        hover && hover.floor === floor && hover.columnKey === columnKey,
    )
