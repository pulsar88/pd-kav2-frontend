import type { CheckboardProperty } from '../../checkboard.types'
import {
    formatCheckboardPrice,
    formatTypeShortLabel,
    getPricePerSqm,
} from '../../checkboardUtils'
import {
    propertyHasSpecialOffer,
    toFiniteNumber,
} from '../../specialOfferUtils'
import SpecialOfferBadges from '../SpecialOfferBadges'

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
    const discountPrice = toFiniteNumber(property.discount_price)
    const hasDiscount = discountPrice != null && discountPrice > 0
    const effectivePrice = hasDiscount ? discountPrice! : property.price
    const pricePerSqm = getPricePerSqm(effectivePrice, property.area)
    const hasPrice = effectivePrice > 0
    const hasArea = property.area > 0
    const hasOffers = propertyHasSpecialOffer(property)
    const offers = hasOffers ? property.special_offers : undefined

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

            {offers?.length ? (
                <SpecialOfferBadges offers={offers} max={3} />
            ) : null}

            {hasDiscount ? (
                <div className="space-y-0.5">
                    <p className="text-lg font-bold leading-tight text-emerald-300">
                        {formatCheckboardPrice(discountPrice!)}
                    </p>
                    {property.price > 0 && property.price !== discountPrice ? (
                        <p className="text-xs text-gray-400 line-through">
                            {formatCheckboardPrice(property.price)}
                        </p>
                    ) : null}
                </div>
            ) : (
                <p className="text-lg font-bold leading-tight text-white">
                    {hasPrice ? formatCheckboardPrice(property.price) : '—'}
                </p>
            )}

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
