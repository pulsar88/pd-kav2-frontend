import type { ReactNode } from 'react'
import Tooltip from '@/components/ui/Tooltip'
import type { CheckboardProperty } from '../../checkboard.types'
import CheckboardPropertyTooltipContent from './CheckboardPropertyTooltipContent'

type CheckboardPropertyCellTooltipProps = {
    property: CheckboardProperty
    wrapperClass?: string
    children: ReactNode
}

const CheckboardPropertyCellTooltip = ({
    property,
    wrapperClass,
    children,
}: CheckboardPropertyCellTooltipProps) => (
    <Tooltip
        placement="top"
        wrapperClass={wrapperClass}
        className="max-w-none px-3 py-2.5"
        title={<CheckboardPropertyTooltipContent property={property} />}
    >
        {children}
    </Tooltip>
)

export default CheckboardPropertyCellTooltip
