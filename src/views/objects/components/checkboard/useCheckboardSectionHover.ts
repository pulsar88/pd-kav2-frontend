import { useCallback, useRef, useState } from 'react'
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
    const hoverRef = useRef<CheckboardHoverTarget>(null)
    const tooltipPropertyIdRef = useRef<number | null>(null)

    const handleEmptyCellHover = useCallback(
        (floor: number, columnKey: string) => {
            const next = { floor, columnKey }
            const prev = hoverRef.current
            if (
                prev?.floor === next.floor &&
                prev?.columnKey === next.columnKey
            ) {
                if (tooltipPropertyIdRef.current != null) {
                    tooltipPropertyIdRef.current = null
                    setTooltipTarget(null)
                }
                return
            }

            hoverRef.current = next
            tooltipPropertyIdRef.current = null
            setHover(next)
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
            const next = { floor, columnKey }
            const prev = hoverRef.current
            const sameHover =
                prev?.floor === next.floor &&
                prev?.columnKey === next.columnKey

            hoverRef.current = next
            tooltipPropertyIdRef.current = property.id

            if (!sameHover) {
                setHover(next)
            }
            // Всегда обновляем property — нужны актуальные special_offers / discount_price
            setTooltipTarget({ property, element })
        },
        [],
    )

    const clearSectionHover = useCallback(() => {
        hoverRef.current = null
        tooltipPropertyIdRef.current = null
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
