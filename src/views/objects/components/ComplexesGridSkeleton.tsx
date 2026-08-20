import Skeleton from '@/components/ui/Skeleton'

const ComplexCardSkeleton = () => (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <Skeleton width="40%" height={12} />
                        <Skeleton width="70%" height={16} />
                    </div>
                ))}
            </div>
        </div>
    </div>
)

const ComplexesGridSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
            <ComplexCardSkeleton key={index} />
        ))}
    </div>
)

export default ComplexesGridSkeleton
