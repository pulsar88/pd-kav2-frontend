import { Link } from 'react-router'
import { TbBuilding, TbCalendar, TbHome, TbMapPin, TbRuler } from 'react-icons/tb'
import type { Complex, ObjectsSearchFilters } from '../types'
import { serializeObjectsSearchFilters } from '../filtersQuery'
import { formatCompletionDate, formatPrice } from '../utils'

type ComplexCardProps = {
    complex: Complex
    matchingPremisesCount?: number
    searchFilters?: ObjectsSearchFilters
}

const ComplexCard = ({
    complex,
    matchingPremisesCount,
    searchFilters,
}: ComplexCardProps) => {
    const params = searchFilters
        ? serializeObjectsSearchFilters(searchFilters, {
              complexIds: [complex.id],
          })
        : new URLSearchParams()

    return (
    <Link
        to={{
            pathname: `/objects/${complex.id}`,
            search: params.toString() ? `?${params.toString()}` : '',
        }}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-700 hover:bg-gray-900 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-900"
    >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
                src={complex.image}
                alt={complex.name}
                className="h-full w-full object-cover"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-semibold leading-tight text-white">
                    {complex.name}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
                    <TbMapPin className="shrink-0 text-base" />
                    <span className="truncate">{complex.address}</span>
                </p>
            </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
            {matchingPremisesCount !== undefined ? (
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                    Найдено помещений:{' '}
                    <span className="tabular-nums">{matchingPremisesCount}</span>
                </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                    <TbHome className="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-500" />
                    <div>
                        <p className="text-xs text-gray-500 transition-colors group-hover:text-gray-400">
                            Квартир
                        </p>
                        <p className="font-semibold text-gray-900 transition-colors group-hover:text-gray-100 dark:text-gray-100">
                            {complex.apartmentsCount}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <TbBuilding className="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-500" />
                    <div>
                        <p className="text-xs text-gray-500 transition-colors group-hover:text-gray-400">
                            Цена от
                        </p>
                        <p className="font-semibold text-gray-900 transition-colors group-hover:text-gray-100 dark:text-gray-100">
                            {formatPrice(complex.priceFrom)}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <TbRuler className="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-500" />
                    <div>
                        <p className="text-xs text-gray-500 transition-colors group-hover:text-gray-400">
                            За м²
                        </p>
                        <p className="font-semibold text-gray-900 transition-colors group-hover:text-gray-100 dark:text-gray-100">
                            {formatPrice(complex.pricePerSqm)}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <TbCalendar className="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-500" />
                    <div>
                        <p className="text-xs text-gray-500 transition-colors group-hover:text-gray-400">
                            Сдача
                        </p>
                        <p className="font-semibold capitalize text-gray-900 transition-colors group-hover:text-gray-100 dark:text-gray-100">
                            {formatCompletionDate(complex.completionDate)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </Link>
    )
}

export default ComplexCard
