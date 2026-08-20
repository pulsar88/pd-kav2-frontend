import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { PiCheckCircle } from 'react-icons/pi'
import Timeline from '@/components/ui/Timeline'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import UserLogAvatar from './UserLogAvatar'
import NotificationLogSkeleton from './NotificationLogSkeleton'
import {
    formatUserLogReadTime,
    formatUserLogTime,
    getUserLogBadgeInnerClass,
    groupUserLogsByDate,
    resolveLogActionHref,
} from '../utils'
import { getUserLogTypeName } from '@/utils/notificationDictionary'
import type { UserLog } from '@/@types/notification'

type LogProps = {
    logs: UserLog[]
    isLoading: boolean
    loadable: boolean
    onLoadMore: () => void | Promise<void>
    onMarkAsRead: (id: number) => void
}

const Log = ({
    logs,
    loadable,
    isLoading,
    onLoadMore,
    onMarkAsRead,
}: LogProps) => {
    const groupedLogs = groupUserLogsByDate(logs)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const node = loadMoreRef.current

        if (!node || !loadable || isLoading) {
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    void onLoadMore()
                }
            },
            { rootMargin: '120px' },
        )

        observer.observe(node)

        return () => observer.disconnect()
    }, [loadable, isLoading, onLoadMore, logs.length])

    if (!isLoading && logs.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <img
                        className="mx-auto mb-2 max-w-[150px]"
                        src="/img/others/no-notification.png"
                        alt="no-notification"
                    />
                    <h6 className="font-semibold">Нет уведомлений</h6>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Новые уведомления появятся здесь
                    </p>
                </div>
            </div>
        )
    }

    if (isLoading && logs.length === 0) {
        return <NotificationLogSkeleton count={4} />
    }

    return (
        <div>
            {groupedLogs.map((group) => (
                <div key={group.dateKey} className="mb-8">
                    <div className="mb-4 font-semibold uppercase">
                        {group.label}
                    </div>
                    <Timeline>
                        {group.items.map((log, index) => {
                            const action = log.action
                                ? resolveLogActionHref(log.action.url)
                                : null

                            return (
                                <Timeline.Item
                                    key={log.id}
                                    isLast={index === group.items.length - 1}
                                    media={
                                        <UserLogAvatar type={log.type} />
                                    }
                                >
                                    <div
                                        className="relative flex cursor-pointer flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:shadow-md dark:hover:border-primary dark:hover:bg-primary/15"
                                        onClick={() => onMarkAsRead(log.id)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-semibold heading-text min-w-0">
                                                {getUserLogTypeName(log)}
                                            </p>
                                            <Badge
                                                className="mt-1 shrink-0 border-0"
                                                innerClass={getUserLogBadgeInnerClass(
                                                    log,
                                                )}
                                            />
                                        </div>
                                        <p className="heading-text">
                                            {log.message}
                                        </p>
                                        {log.action ? (
                                            <div>
                                                {action?.external ? (
                                                    <a
                                                        href={log.action.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-sm font-medium text-primary hover:underline"
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        {log.action.text}
                                                    </a>
                                                ) : (
                                                    <Link
                                                        to={
                                                            action?.href ||
                                                            log.action.url
                                                        }
                                                        className="text-sm font-medium text-primary hover:underline"
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        {log.action.text}
                                                    </Link>
                                                )}
                                            </div>
                                        ) : null}
                                        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                            <span>
                                                Создано{' '}
                                                {formatUserLogTime(
                                                    log.created_at,
                                                )}
                                            </span>
                                            {log.read_at ? (
                                                <span>
                                                    Прочитано{' '}
                                                    {formatUserLogReadTime(
                                                        log.read_at,
                                                    )}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </Timeline.Item>
                            )
                        })}
                    </Timeline>
                </div>
            ))}

            <div ref={loadMoreRef} className="py-6 text-center">
                {isLoading && logs.length > 0 ? (
                    <Spinner size={32} />
                ) : !loadable && logs.length > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                            <PiCheckCircle />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Больше нет записей
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default Log
