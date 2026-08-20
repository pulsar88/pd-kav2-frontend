import type { CheckboardProperty } from '../../checkboard.types'
import {
    formatCheckboardPrice,
    formatTypeShortLabel,
    getPricePerSqm,
} from '../../checkboardUtils'

type CheckboardPropertyTooltipContentProps = {
    property: CheckboardProperty
}

const getRoomsBadgeLabel = (property: CheckboardProperty) => {
    if (property.type.has_rooms) {
        return String(property.rooms_count)
    }

    return formatTypeShortLabel(property)
}

const CheckboardPropertyTooltipContent = ({
    property,
}: CheckboardPropertyTooltipContentProps) => {
    const pricePerSqm = getPricePerSqm(property.price, property.area)
    const hasPrice = property.price > 0
    const hasArea = property.area > 0

    return (
        <div className="min-w-[240px] space-y-2 text-left">
            <div className="flex items-center gap-2">
                <span
                    className="inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{
                        backgroundColor: property.status.color,
                        color: property.status.text_color,
                    }}
                >
                    {getRoomsBadgeLabel(property)}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-200">
                    {property.type.name}
                </span>
                <span className="shrink-0 text-xs font-semibold text-white">
                    №{property.number}
                </span>
            </div>

            <p className="text-lg font-bold leading-tight text-white">
                {hasPrice ? formatCheckboardPrice(property.price) : '—'}
            </p>

            <p className="text-xs text-gray-300">
                {hasArea ? `${property.area} м²` : '—'}
                {hasPrice && hasArea ? (
                    <>
                        {' · '}
                        {formatCheckboardPrice(pricePerSqm)}/м²
                    </>
                ) : null}
            </p>
        </div>
    )
}

export default CheckboardPropertyTooltipContent
