import { useCallback, useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Container from '@/components/shared/Container'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import NoDataFound from '@/assets/svg/NoDataFound'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import { apiGetSpecialOffers } from '@/services/SpecialOffersService'
import classNames from '@/utils/classNames'
import SpecialOfferCard from './components/SpecialOfferCard'
import type { SpecialOffer } from './types'

const SpecialOffersList = () => {
    const [offers, setOffers] = useState<SpecialOffer[]>([])
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    const loadOffers = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await apiGetSpecialOffers({
                page: pageIndex,
            })

            const list = response?.data ?? []
            setOffers(list)

            if (response?.meta) {
                setTotal(response.meta.total ?? list.length)
                if (response.meta.per_page) {
                    setPageSize(response.meta.per_page)
                }
            } else {
                setTotal(list.length)
            }
        } catch {
            setOffers([])
            setTotal(0)
        } finally {
            setIsLoading(false)
        }
    }, [pageIndex])

    useEffect(() => {
        void loadOffers()
    }, [loadOffers])

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
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {offers.map((offer) => (
                                    <SpecialOfferCard
                                        key={offer.id}
                                        offer={offer}
                                    />
                                ))}
                            </div>

                            {total > pageSize ? (
                                <div className="mt-6 flex items-center justify-start">
                                    <Pagination
                                        pageSize={pageSize}
                                        currentPage={pageIndex}
                                        total={total}
                                        onChange={(page) => setPageIndex(page)}
                                    />
                                </div>
                            ) : null}
                        </>
                    )}
                </Card>
            </div>
        </>
    )
}

export default SpecialOffersList
