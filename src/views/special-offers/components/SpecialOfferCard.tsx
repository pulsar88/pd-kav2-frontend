import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { TbCalendar, TbHome } from 'react-icons/tb'
import { PiPercentDuotone } from 'react-icons/pi'
import Button from '@/components/ui/Button'
import { formatOfferPeriod, stripHtml } from '../utils'
import type { SpecialOffer } from '../types'

type SpecialOfferCardProps = {
    offer: SpecialOffer
}

const SpecialOfferCard = ({ offer }: SpecialOfferCardProps) => {
    const navigate = useNavigate()
    const preview = stripHtml(offer.description || '')
    const badgeBg = offer.color || '#0ea5e9'
    const badgeFg = offer.text_color || '#ffffff'

    const openOffer = () => navigate(`/offers/${offer.id}`)

    const openPremises = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        navigate(
            `/objects?tab=premises&special_offer_id=${encodeURIComponent(String(offer.id))}`,
        )
    }

    return (
        <div className="group flex h-full flex-col rounded-xl border border-transparent bg-gray-100 p-6 text-left transition-colors hover:border-primary/40 hover:bg-primary/10 dark:bg-gray-700/15">
            <button
                type="button"
                className="flex min-h-0 flex-1 flex-col text-left outline-hidden"
                onClick={openOffer}
            >
                <div className="mb-4 flex items-start justify-between gap-2">
                    <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors group-hover:opacity-90"
                        style={{ backgroundColor: badgeBg, color: badgeFg }}
                    >
                        <PiPercentDuotone className="text-2xl" />
                    </span>
                    {offer.badge_text ? (
                        <span
                            className="max-w-[60%] truncate rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                                backgroundColor: badgeBg,
                                color: badgeFg,
                            }}
                        >
                            {offer.badge_text}
                        </span>
                    ) : null}
                </div>

                <h4 className="mb-2 line-clamp-2 font-bold heading-text group-hover:text-primary">
                    {offer.name}
                </h4>

                {preview ? (
                    <p className="mb-4 line-clamp-3 flex-1 text-sm text-gray-600 dark:text-gray-300">
                        {preview}
                    </p>
                ) : (
                    <div className="flex-1" />
                )}

                <div className="mt-auto flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <TbCalendar className="shrink-0 text-base" />
                        <span className="truncate">
                            {formatOfferPeriod(
                                offer.start_date,
                                offer.end_date,
                            )}
                        </span>
                    </div>
                    {typeof offer.properties_count === 'number' ? (
                        <div
                            className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold shadow-sm"
                            style={{
                                backgroundColor: badgeBg,
                                color: badgeFg,
                            }}
                        >
                            <TbHome className="shrink-0 text-base" />
                            <span>{offer.properties_count}</span>
                            <span className="font-semibold opacity-90">
                                объект
                                {offer.properties_count === 1
                                    ? ''
                                    : offer.properties_count >= 2 &&
                                        offer.properties_count <= 4
                                      ? 'а'
                                      : 'ов'}
                            </span>
                        </div>
                    ) : null}
                </div>
            </button>

            <div className="mt-4 border-t border-gray-200/80 pt-4 dark:border-gray-600/60">
                <Button
                    block
                    size="sm"
                    variant="solid"
                    icon={<TbHome />}
                    onClick={openPremises}
                >
                    Смотреть помещения
                </Button>
            </div>
        </div>
    )
}

export default SpecialOfferCard
