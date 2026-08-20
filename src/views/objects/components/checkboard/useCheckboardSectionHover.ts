import { useCallback, useState } from 'react'
import type { CheckboardProperty } from '../../checkboard.types'

export type CheckboardHoverTarget = {
    floor: number
    columnKey: string
} | null

export type CheckboardPropertyTooltipTarget = {
    property: CheckboardProperty
    element: HTMLElement
} | null

export const useCheckboardSectionHover = () => {
    const [hover, setHover] = useState<CheckboardHoverTarget>(null)
    const [tooltipTarget, setTooltipTarget] =
        useState<CheckboardPropertyTooltipTarget>(null)

    const handleEmptyCellHover = useCallback(
        (floor: number, columnKey: string) => {
            setHover({ floor, columnKey })
            setTooltipTarget(null)
        },
        [],
    )

    const handlePropertyCellHover = useCallback(
        (
            property: CheckboardProperty,
            floor: number,
            columnKey: string,
            element: HTMLElement,
        ) => {
            setHover({ floor, columnKey })
            setTooltipTarget({ property, element })
        },
        [],
    )

    const clearSectionHover = useCallback(() => {
        setHover(null)
        setTooltipTarget(null)
    }, [])

    return {
        hover,
        tooltipTarget,
        handleEmptyCellHover,
        handlePropertyCellHover,
        clearSectionHover,
    }
}
