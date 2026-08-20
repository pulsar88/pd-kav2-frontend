import Skeleton from '@/components/ui/Skeleton'

const PremiseResultItemSkeleton = () => (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex w-full items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
            <Skeleton
                height={80}
                width={80}
                className="hidden shrink-0 rounded-xl sm:block"
            />
            <Skeleton
                height={64}
                width={64}
                className="shrink-0 rounded-xl sm:hidden"
            />
            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Skeleton width="40%" height={18} />
                    <Skeleton width={72} height={20} className="rounded-full" />
                </div>
                <Skeleton width="75%" height={14} />
                <Skeleton width="45%" height={12} />
            </div>
            <div className="hidden shrink-0 space-y-2 sm:block">
                <Skeleton width={96} height={18} />
                <Skeleton width={72} height={12} className="ml-auto" />
            </div>
        </div>
    </div>
)

const PremisesListSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="flex flex-col gap-3">
        <Skeleton width={180} height={20} />
        {Array.from({ length: count }).map((_, index) => (
            <PremiseResultItemSkeleton key={index} />
        ))}
    </div>
)

export default PremisesListSkeleton
