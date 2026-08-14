import Skeleton from '@/components/ui/Skeleton'

type NotificationLogSkeletonProps = {
    count?: number
    showDateGroup?: boolean
    compact?: boolean
}

const NotificationLogSkeletonItem = ({ compact = false }) => (
    <div className={compact ? 'flex gap-3 px-4 py-3' : 'flex gap-4'}>
        <Skeleton variant="circle" width={35} height={35} className="shrink-0" />
        <div
            className={
                compact
                    ? 'min-w-0 flex-1 space-y-2'
                    : 'flex-1 space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-700'
            }
        >
            <div className="flex items-start justify-between gap-3">
                <Skeleton width="35%" height={16} />
                <Skeleton variant="circle" width={12} height={12} className="shrink-0" />
            </div>
            <Skeleton width="100%" height={14} />
            <Skeleton width="75%" height={14} />
            {!compact ? <Skeleton width="25%" height={12} className="ml-auto" /> : null}
            {compact ? <Skeleton width="20%" height={12} /> : null}
        </div>
    </div>
)

const NotificationLogSkeleton = ({
    count = 3,
    showDateGroup = true,
    compact = false,
}: NotificationLogSkeletonProps) => (
    <div className={compact ? 'space-y-1' : 'space-y-4'}>
        {showDateGroup ? (
            <Skeleton width={120} height={18} className="mb-4" />
        ) : null}
        {Array.from({ length: count }).map((_, index) => (
            <NotificationLogSkeletonItem key={index} compact={compact} />
        ))}
    </div>
)

export default NotificationLogSkeleton
