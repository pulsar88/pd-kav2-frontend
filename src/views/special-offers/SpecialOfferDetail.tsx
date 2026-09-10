import { useEffect, useState } from 'react'
import ReactHtmlParser from 'html-react-parser'
import { useNavigate, useParams } from 'react-router'
import { TbArrowNarrowLeft, TbCalendar, TbHome } from 'react-icons/tb'
import { PiPercentDuotone } from 'react-icons/pi'
import Loading from '@/components/shared/Loading'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import TextBlockSkeleton from '@/components/shared/loaders/TextBlockSkeleton'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { richTextTableClass } from '@/components/shared/RichTextEditor/tableStyles'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import { apiGetSpecialOffer } from '@/services/SpecialOffersService'
import classNames from '@/utils/classNames'
import { formatOfferPeriod } from './utils'
import type { SpecialOffer } from './types'

const SpecialOfferDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [offer, setOffer] = useState<SpecialOffer | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(id))

    useEffect(() => {
        if (!id) {
            setOffer(null)
            setIsLoading(false)
            return
        }

        let cancelled = false
        setIsLoading(true)

        void apiGetSpecialOffer(id)
            .then((data) => {
                if (!cancelled) {
                    setOffer(data)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOffer(null)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [id])

    const badgeBg = offer?.color || '#0ea5e9'
    const badgeFg = offer?.text_color || '#ffffff'

    const handleOpenPremises = () => {
        if (!offer) return
        navigate(
            `/objects?tab=premises&special_offer_id=${encodeURIComponent(String(offer.id))}`,
        )
    }

    return (
        <div
            className={classNames(
                'min-w-0 w-full py-6',
                PAGE_CONTAINER_GUTTER_X,
            )}
        >
            <Card
                className="min-w-0 w-full"
                header={{
                    bordered: true,
                    className: 'card-header-extra',
                    content: (
                        <button
                            type="button"
                            className="inline-flex shrink-0 items-center gap-3 text-gray-800 outline-hidden transition-colors hover:text-primary dark:text-gray-100 dark:hover:text-primary"
                            onClick={() => navigate('/offers')}
                        >
                            <span className="rounded-full bg-gray-100 p-2 text-xl transition-colors hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/20">
                                <TbArrowNarrowLeft />
                            </span>
                            <span className="font-semibold">
                                К списку акций
                            </span>
                        </button>
                    ),
                }}
            >
                <Loading
                    loading={isLoading}
                    customLoader={
                        <div className="flex flex-col gap-4 p-2">
                            <MediaSkeleton />
                            <TextBlockSkeleton rowCount={6} />
                        </div>
                    }
                >
                    {offer ? (
                        <div className="p-1 sm:p-2">
                            <div className="mb-6 flex flex-wrap items-start gap-4">
                                <span
                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-sm"
                                    style={{
                                        backgroundColor: badgeBg,
                                        color: badgeFg,
                                    }}
                                >
                                    <PiPercentDuotone className="text-3xl" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="mb-3">{offer.name}</h3>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {offer.badge_text ? (
                                            <span
                                                className="rounded-full px-3 py-1 text-xs font-semibold"
                                                style={{
                                                    backgroundColor: badgeBg,
                                                    color: badgeFg,
                                                }}
                                            >
                                                {offer.badge_text}
                                            </span>
                                        ) : null}
                                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                            <TbCalendar className="text-base" />
                                            {formatOfferPeriod(
                                                offer.start_date,
                                                offer.end_date,
                                            )}
                                        </span>
                                        {typeof offer.properties_count ===
                                        'number' ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                <TbHome className="text-base" />
                                                Объектов:{' '}
                                                {offer.properties_count}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`prose dark:prose-invert mt-2 max-w-none prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:mt-2 [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_h4]:!text-gray-900 [&_h5]:!text-gray-900 [&_h6]:!text-gray-900 dark:[&_h1]:!text-gray-100 dark:[&_h2]:!text-gray-100 dark:[&_h3]:!text-gray-100 dark:[&_h4]:!text-gray-100 dark:[&_h5]:!text-gray-100 dark:[&_h6]:!text-gray-100 [&_img]:my-4 [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl ${richTextTableClass}`}
                            >
                                {ReactHtmlParser(offer.description || '')}
                            </div>

                            <div className="mt-8">
                                <Button
                                    variant="solid"
                                    icon={<TbHome />}
                                    onClick={handleOpenPremises}
                                >
                                    Смотреть помещения по акции
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                            Акция не найдена
                        </div>
                    )}
                </Loading>
            </Card>
        </div>
    )
}

export default SpecialOfferDetail
