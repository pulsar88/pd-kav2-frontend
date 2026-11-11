import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import classNames from 'classnames'
import { HiOutlineMailOpen } from 'react-icons/hi'
import { PiCheckCircle } from 'react-icons/pi'

import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Dropdown from '@/components/ui/Dropdown'
import type { DropdownRef } from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NotificationToggle from './NotificationToggle'

import UserLogAvatar from '@/views/notifications/components/UserLogAvatar'
import UserLogActionButton from '@/views/notifications/components/UserLogActionButton'
import NotificationLogSkeleton from '@/views/notifications/components/NotificationLogSkeleton'

import {
    apiGetNotificationDictionaries,
    apiGetUnreadLogsCount,
    apiGetUserLogs,
    apiMarkUserLogsAsRead,
} from '@/services/NotificationService'

import {
    formatUserLogTime,
    getUserLogBadgeInnerClass,
    isUserLogRead,
} from '@/views/notifications/utils'

import { getUserLogTypeName } from '@/utils/notificationDictionary'
import { registerUserLogsBroadcastHandlers } from '@/services/broadcast/userLogsBroadcastBus'
import useInfiniteScroll from '@/utils/hooks/useInfiniteScroll'
import useResponsive from '@/utils/hooks/useResponsive'

import type {
    NotificationTypeDictionaryItem,
    UserLog,
} from '@/@types/notification'

const notificationExpandedHeight = 'h-[280px]'
const seenNotificationRatio = 0.6

const isNotificationSeen = (entry: IntersectionObserverEntry) => {
    if (entry.intersectionRatio >= seenNotificationRatio) {
        return true
    }

    const rootHeight = entry.rootBounds?.height ?? 0

    return (
        rootHeight > 0 &&
        entry.isIntersecting &&
        entry.boundingClientRect.height > rootHeight &&
        entry.intersectionRect.height >= rootHeight * 0.85
    )
}

type NotificationProps = {
    className?: string
}

const _Notification = ({ className }: NotificationProps) => {
    const [notificationList, setNotificationList] = useState<UserLog[]>([])
    const [notificationTypes, setNotificationTypes] = useState<
        NotificationTypeDictionaryItem[]
    >([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [badgePulseKey, setBadgePulseKey] = useState(0)
    const [initialLoading, setInitialLoading] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [page, setPage] = useState(1)

    const { larger } = useResponsive()
    const navigate = useNavigate()

    const notificationDropdownRef = useRef<DropdownRef>(null)
    const loadRequestRef = useRef(0)
    const seenNotificationIdsRef = useRef<Set<number>>(new Set())
    const scrollRootRef = useRef<HTMLElement | null>(null)

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await apiGetUnreadLogsCount()
            setUnreadCount(count)
        } catch {
            // Счётчик не критичен для работы уведомлений
        }
    }, [])

    useEffect(() => {
        void refreshUnreadCount()
    }, [refreshUnreadCount])

    useEffect(() => {
        return registerUserLogsBroadcastHandlers({
            onLogCreated: (log) => {
                void refreshUnreadCount()
                setBadgePulseKey((key) => key + 1)
                setNotificationList((prevList) => {
                    if (prevList.some((item) => item.id === log.id)) {
                        return prevList
                    }

                    return [log, ...prevList]
                })
            },
            onLogsReaded: (ids) => {
                void refreshUnreadCount()
                setNotificationList((prevList) =>
                    prevList.filter((item) => !ids.includes(item.id)),
                )
            },
            onLogsSynced: () => {
                setNotificationList([])
                setHasMore(false)
                void refreshUnreadCount()
            },
        })
    }, [refreshUnreadCount])

    const loadPage = useCallback(
        async (pageNumber: number) => {
            const response = await apiGetUserLogs({
                page: pageNumber,
                is_unread: true,
                set_read: false,
                notificationTypes,
            })

            return response
        },
        [notificationTypes],
    )

    const onNotificationOpen = async (open: boolean) => {
        if (!open) {
            const ids = [...seenNotificationIdsRef.current]
            seenNotificationIdsRef.current.clear()

            if (ids.length > 0) {
                void apiMarkUserLogsAsRead({ ids })
            }

            return
        }

        seenNotificationIdsRef.current.clear()

        const requestId = loadRequestRef.current + 1
        loadRequestRef.current = requestId

        const knownIds = new Set(notificationList.map((item) => item.id))

        setInitialLoading(true)

        try {
            let types = notificationTypes

            if (types.length === 0) {
                const dictionaries = await apiGetNotificationDictionaries()
                types = dictionaries.notification_types

                if (requestId !== loadRequestRef.current) {
                    return
                }

                setNotificationTypes(types)
            }

            const response = await apiGetUserLogs({
                page: 1,
                is_unread: true,
                set_read: false,
                notificationTypes: types,
            })

            if (requestId !== loadRequestRef.current) {
                return
            }

            setNotificationList((current) => {
                const fetchedIds = new Set(response.data.map((item) => item.id))
                const arrivedDuringLoad = current.filter(
                    (item) =>
                        !knownIds.has(item.id) && !fetchedIds.has(item.id),
                )

                return [...arrivedDuringLoad, ...response.data]
            })
            setHasMore(response.meta.current_page < response.meta.last_page)
            setPage(1)
            setLoaded(true)
            await refreshUnreadCount()
        } finally {
            if (requestId === loadRequestRef.current) {
                setInitialLoading(false)
            }
        }
    }

    const onLoadMore = useCallback(async () => {
        if (!hasMore) {
            return
        }

        const nextPage = page + 1
        const response = await loadPage(nextPage)

        setNotificationList((prevList) => [...prevList, ...response.data])
        setHasMore(response.meta.current_page < response.meta.last_page)
        setPage(nextPage)
    }, [hasMore, loadPage, page])

    const { containerRef, isLoading: loadingMore } = useInfiniteScroll({
        shouldStop: !hasMore || !loaded,
        onLoadMore,
    })

    const setScrollNode = (node: HTMLElement | null) => {
        scrollRootRef.current = node

        if (typeof containerRef === 'function') {
            containerRef(node)
        }
    }

    const unreadIds = useMemo(
        () =>
            notificationList
                .filter((item) => !isUserLogRead(item))
                .map((item) => item.id),
        [notificationList],
    )

    const onMarkAllAsRead = async () => {
        if (unreadIds.length === 0) {
            return
        }

        await apiMarkUserLogsAsRead({ ids: unreadIds })

        setNotificationList([])
        setHasMore(false)
        await refreshUnreadCount()
    }

    const onMarkAsRead = async (id: number) => {
        const target = notificationList.find((item) => item.id === id)

        if (!target || isUserLogRead(target)) {
            return
        }

        await apiMarkUserLogsAsRead({ ids: [id] })

        setNotificationList((prevList) =>
            prevList.filter((item) => item.id !== id),
        )

        await refreshUnreadCount()
    }

    const handleViewAllActivity = () => {
        setNotificationList([])
        setHasMore(false)
        notificationDropdownRef.current?.handleDropdownClose()
        navigate('/account/notifications')
    }

    /* Отмечаем уведомления прочитанными, когда пользователь реально их увидел */
    useEffect(() => {
        const root = scrollRootRef.current

        if (!root || !loaded) {
            return
        }

        const nodes = root.querySelectorAll<HTMLElement>(
            '[data-notification-id]',
        )

        if (nodes.length === 0) {
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const element = entry.target as HTMLElement

                    if (element.dataset.notificationUnread !== 'true') {
                        return
                    }

                    if (!isNotificationSeen(entry)) {
                        return
                    }

                    const id = Number(element.dataset.notificationId)

                    if (!Number.isFinite(id)) {
                        return
                    }

                    seenNotificationIdsRef.current.add(id)
                })
            },
            { root, threshold: [0, seenNotificationRatio, 1] },
        )

        nodes.forEach((node) => observer.observe(node))

        return () => observer.disconnect()
    }, [loaded, notificationList])

    const showEmptyState =
        !initialLoading && loaded && notificationList.length === 0

    const useExpandedHeight = notificationList.length >= 3

    const scrollAreaHeight = useMemo(
        () => (useExpandedHeight ? notificationExpandedHeight : 'h-auto'),
        [useExpandedHeight],
    )

    const centeredContentHeight = useExpandedHeight
        ? notificationExpandedHeight
        : 'py-8'

    return (
        <Dropdown
            ref={notificationDropdownRef}
            renderTitle={
                <NotificationToggle
                    dot={unreadCount > 0}
                    pulseKey={badgePulseKey}
                    className={className}
                />
            }
            menuClass="min-w-[280px] md:min-w-[340px]"
            placement={larger.md ? 'bottom-end' : 'bottom'}
            onOpen={onNotificationOpen}
        >
            <Dropdown.Item variant="header">
                <div className="dark:border-gray-700 px-2 flex items-center justify-between mb-1">
                    <h6>Уведомления</h6>
                    <Button
                        variant="plain"
                        shape="circle"
                        size="sm"
                        icon={<HiOutlineMailOpen className="text-xl" />}
                        title="Отметить все как прочитанные"
                        disabled={unreadIds.length === 0}
                        onClick={() => {
                            void onMarkAllAsRead()
                        }}
                    />
                </div>
            </Dropdown.Item>

            <ScrollBar
                className={classNames('overflow-y-auto', scrollAreaHeight)}
                scrollableNodeProps={{ ref: setScrollNode }}
            >
                {initialLoading && notificationList.length === 0 ? (
                    <div className="px-1 py-2">
                        <NotificationLogSkeleton
                            count={2}
                            showDateGroup={false}
                            compact
                        />
                    </div>
                ) : null}

                {notificationList.map((item) => {
                    return (
                        <div key={item.id}>
                            <div
                                data-notification-id={item.id}
                                data-notification-unread={
                                    isUserLogRead(item) ? 'false' : 'true'
                                }
                                className="relative flex cursor-pointer gap-3 rounded-xl border border-transparent px-4 py-3 transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:shadow-md dark:hover:border-primary dark:hover:bg-primary/15"
                                onClick={() => {
                                    void onMarkAsRead(item.id)
                                }}
                            >
                                <UserLogAvatar type={item.type} />

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-semibold heading-text min-w-0">
                                            {getUserLogTypeName(item)}
                                        </p>
                                        <Badge
                                            className="mt-1 shrink-0 border-0"
                                            innerClass={getUserLogBadgeInnerClass(
                                                item,
                                            )}
                                        />
                                    </div>

                                    <p
                                        className="line-clamp-2 break-words text-sm heading-text"
                                        title={item.message}
                                    >
                                        {item.message}
                                    </p>

                                    {item.action ? (
                                        <div className="mt-1.5">
                                            <UserLogActionButton
                                                action={item.action}
                                                onRead={() => {
                                                    void onMarkAsRead(item.id)
                                                }}
                                            />
                                        </div>
                                    ) : null}

                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        {formatUserLogTime(item.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {loadingMore && notificationList.length > 0 ? (
                    <div className="flex items-center justify-center py-3">
                        <Spinner size={28} />
                    </div>
                ) : null}

                {showEmptyState ? (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            centeredContentHeight,
                        )}
                    >
                        <div className="text-center">
                            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                                <PiCheckCircle />
                            </div>
                            <h6 className="font-semibold">
                                Новых уведомлений нет
                            </h6>
                        </div>
                    </div>
                ) : null}
            </ScrollBar>

            <Dropdown.Item variant="header">
                <div className="pt-4">
                    <Button
                        block
                        variant="solid"
                        onClick={handleViewAllActivity}
                    >
                        Все уведомления
                    </Button>
                </div>
            </Dropdown.Item>
        </Dropdown>
    )
}

const Notification = withHeaderItem(_Notification)

export default Notification
