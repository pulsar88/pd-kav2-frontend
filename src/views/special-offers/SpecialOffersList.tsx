import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Container from '@/components/shared/Container'
import Spinner from '@/components/ui/Spinner'
import NoDataFound from '@/assets/svg/NoDataFound'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import { apiGetSpecialOffers } from '@/services/SpecialOffersService'
import classNames from '@/utils/classNames'
import SpecialOfferCard from './components/SpecialOfferCard'
import type { SpecialOffer } from './types'

const SpecialOffersList = () => {
    const [offers, setOffers] = useState<SpecialOffer[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)

        void apiGetSpecialOffers()
            .then((list) => {
                if (!cancelled) {
                    setOffers(list)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOffers([])
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
    }, [])

    return (
        <>
            <section className="flex h-[220px] flex-col justify-center bg-primary/10 dark:bg-primary/20 sm:h-[260px]">
                <Container className="flex flex-col items-center px-4">
                    <h2 className="mb-3 text-center">Акции</h2>
                    <p className="max-w-[420px] text-center text-gray-600 dark:text-gray-300">
                        Специальные предложения и условия по объектам
                    </p>
                </Container>
            </section>

            <div
                className={classNames(
                    'my-12 min-w-0 w-full',
                    PAGE_CONTAINER_GUTTER_X,
                )}
            >
                <Card className="w-full">
                    {isLoading ? (
                        <div className="flex min-h-[240px] items-center justify-center">
                            <Spinner size={40} />
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 py-16">
                            <NoDataFound />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Пока нет активных акций
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {offers.map((offer) => (
                                <SpecialOfferCard
                                    key={offer.id}
                                    offer={offer}
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </>
    )
}

export default SpecialOffersList
