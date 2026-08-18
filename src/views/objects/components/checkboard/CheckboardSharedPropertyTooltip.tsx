import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    autoUpdate,
    flip,
    FloatingPortal,
    offset,
    shift,
    useFloating,
} from '@floating-ui/react'
import Arrow from '@/components/ui/Tooltip/Arrow'
import type { CheckboardProperty } from '../../checkboard.types'
import CheckboardPropertyTooltipContent from './CheckboardPropertyTooltipContent'

type CheckboardSharedPropertyTooltipProps = {
    property: CheckboardProperty | null
    referenceElement: HTMLElement | null
}

const CheckboardSharedPropertyTooltip = ({
    property,
    referenceElement,
}: CheckboardSharedPropertyTooltipProps) => {
    const open = Boolean(property && referenceElement)

    const { refs, floatingStyles, context } = useFloating({
        open,
        placement: 'top',
        middleware: [
            offset(7),
            flip({
                fallbackAxisSideDirection: 'start',
            }),
            shift(),
        ],
    })

    useEffect(() => {
        refs.setReference(referenceElement)
    }, [referenceElement, refs])

    useEffect(() => {
        if (!open || !referenceElement || !refs.floating.current) {
            return undefined
        }

        return autoUpdate(
            referenceElement,
            refs.floating.current,
            refs.update,
        )
    }, [open, referenceElement, refs])

    if (!open || !property) {
        return null
    }

    return (
        <FloatingPortal>
            <motion.div
                ref={refs.setFloating}
                className="tooltip max-w-none bg-gray-800 px-3 py-2.5 dark:bg-black"
                initial={{
                    opacity: 0,
                    visibility: 'hidden',
                }}
                animate={{
                    opacity: 1,
                    visibility: 'visible',
                }}
                transition={{
                    duration: 0.15,
                    type: 'tween',
                }}
                style={floatingStyles}
                role="tooltip"
            >
                <CheckboardPropertyTooltipContent property={property} />
                <Arrow
                    placement={context.placement}
                    color="text-gray-800 dark:text-black"
                />
            </motion.div>
        </FloatingPortal>
    )
}

export default CheckboardSharedPropertyTooltip
