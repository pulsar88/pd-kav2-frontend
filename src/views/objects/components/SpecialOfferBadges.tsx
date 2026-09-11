import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import {
    autoUpdate,
    flip,
    FloatingPortal,
    offset,
    safePolygon,
    shift,
    useDismiss,
    useFloating,
    useHover,
    useInteractions,
    useRole,
} from '@floating-ui/react'
import { motion } from 'framer-motion'
import { TbCalendar, TbHome } from 'react-icons/tb'
import Button from '@/components/ui/Button'
import classNames from '@/utils/classNames'
import {
    formatOfferPeriod,
    stripHtml,
} from '@/views/special-offers/utils'
import type { PremiseSpecialOffer } from '../types'

type SpecialOfferBadgesProps = {
    offers?: PremiseSpecialOffer[] | null
    className?: string
    max?: number
    /** Тултип с описанием акции */
    interactiveDetails?: boolean
    /** Кнопка «Смотреть помещения» в тултипе */
    showPremisesAction?: boolean
}

type OfferBadgeProps = {
    offer: PremiseSpecialOffer
    interactiveDetails?: boolean
    showPremisesAction?: boolean
}

const OfferBadge = ({
    offer,
    interactiveDetails,
    showPremisesAction,
}: OfferBadgeProps) => {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const label = offer.badge_text || offer.name
    const description = stripHtml(offer.description || '')
    const period =
        offer.start_date && offer.end_date
            ? formatOfferPeriod(offer.start_date, offer.end_date)
            : null

    const { refs, floatingStyles, context } = useFloating({
        open,
        onOpenChange: setOpen,
        placement: 'top',
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(8),
            flip({ fallbackAxisSideDirection: 'start' }),
            shift(),
        ],
    })

    const hover = useHover(context, {
        enabled: Boolean(interactiveDetails),
        move: false,
        delay: { open: 120, close: 120 },
        handleClose: safePolygon({ blockPointerEvents: true }),
    })
    const dismiss = useDismiss(context)
    const role = useRole(context, { role: 'tooltip' })
    const { getReferenceProps, getFloatingProps } = useInteractions([
        hover,
        dismiss,
        role,
    ])

    const openPremises = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        navigate(
            `/objects?tab=premises&special_offer_id=${encodeURIComponent(String(offer.id))}`,
        )
    }

    const badge = (
        <span
            ref={interactiveDetails ? refs.setReference : undefined}
            {...(interactiveDetails ? getReferenceProps() : {})}
            className="inline-flex max-w-full cursor-default items-center truncate rounded-lg px-2.5 py-1 text-xs font-bold leading-tight shadow-sm"
            style={{
                backgroundColor: offer.color || '#0ea5e9',
                color: offer.text_color || '#ffffff',
            }}
            title={interactiveDetails ? undefined : offer.name}
            onClick={
                interactiveDetails
                    ? (event) => {
                          event.preventDefault()
                          event.stopPropagation()
                      }
                    : undefined
            }
        >
            {label}
        </span>
    )

    if (!interactiveDetails) {
        return badge
    }

    const hasBody = Boolean(description || period || showPremisesAction)

    return (
        <>
            {badge}
            {open ? (
                <FloatingPortal>
                    <motion.div
                        ref={refs.setFloating}
                        className={classNames(
                            'z-[1100] w-[min(320px,calc(100vw-2rem))] rounded-xl border border-gray-700 bg-gray-800 p-3 text-left shadow-xl dark:border-gray-600 dark:bg-black',
                        )}
                        initial={{ opacity: 0, visibility: 'hidden' }}
                        animate={{ opacity: 1, visibility: 'visible' }}
                        transition={{ duration: 0.15, type: 'tween' }}
                        style={floatingStyles}
                        {...getFloatingProps()}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <p
                            className={classNames(
                                'text-sm font-bold text-white',
                                hasBody && 'mb-1.5',
                            )}
                        >
                            {offer.name}
                        </p>
                        {description ? (
                            <p
                                className={classNames(
                                    'line-clamp-4 text-xs leading-relaxed text-gray-300',
                                    (period || showPremisesAction) && 'mb-2',
                                )}
                            >
                                {description}
                            </p>
                        ) : null}
                        {period ? (
                            <p
                                className={classNames(
                                    'flex items-center gap-1.5 text-xs text-gray-400',
                                    showPremisesAction && 'mb-3',
                                )}
                            >
                                <TbCalendar className="shrink-0 text-sm" />
                                <span>{period}</span>
                            </p>
                        ) : null}
                        {showPremisesAction ? (
                            <Button
                                block
                                size="sm"
                                variant="solid"
                                icon={<TbHome />}
                                onClick={openPremises}
                            >
                                Смотреть помещения
                            </Button>
                        ) : null}
                    </motion.div>
                </FloatingPortal>
            ) : null}
        </>
    )
}

const SpecialOfferBadges = ({
    offers,
    className,
    max = 2,
    interactiveDetails = false,
    showPremisesAction = false,
}: SpecialOfferBadgesProps) => {
    if (!offers?.length) return null

    const visible = offers.slice(0, max)
    const rest = offers.length - visible.length

    return (
        <div
            className={classNames(
                'flex min-w-0 max-w-full flex-wrap items-center gap-1.5',
                className,
            )}
        >
            {visible.map((offer) => (
                <OfferBadge
                    key={offer.id}
                    offer={offer}
                    interactiveDetails={interactiveDetails}
                    showPremisesAction={showPremisesAction}
                />
            ))}
            {rest > 0 ? (
                <span className="inline-flex items-center rounded-lg bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-100">
                    +{rest}
                </span>
            ) : null}
        </div>
    )
}

export default SpecialOfferBadges
