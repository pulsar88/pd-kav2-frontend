import { useEffect, useState, useRef, useCallback, useMemo } from 'react'

import classNames from 'classnames'

import withHeaderItem from '@/utils/hoc/withHeaderItem'

import Dropdown from '@/components/ui/Dropdown'

import ScrollBar from '@/components/ui/ScrollBar'

import Spinner from '@/components/ui/Spinner'

import Badge from '@/components/ui/Badge'

import Button from '@/components/ui/Button'

import NotificationToggle from './NotificationToggle'

import UserLogAvatar from '@/views/notifications/components/UserLogAvatar'
import NotificationLogSkeleton from '@/views/notifications/components/NotificationLogSkeleton'

import { HiOutlineMailOpen } from 'react-icons/hi'

import { PiCheckCircle } from 'react-icons/pi'

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

    resolveLogActionHref,

} from '@/views/notifications/utils'

import { getUserLogTypeName } from '@/utils/notificationDictionary'

import { registerUserLogsBroadcastHandlers } from '@/services/broadcast/userLogsBroadcastBus'

import useInfiniteScroll from '@/utils/hooks/useInfiniteScroll'

import isLastChild from '@/utils/isLastChild'

import useResponsive from '@/utils/hooks/useResponsive'

import { useNavigate, Link } from 'react-router'

import type { DropdownRef } from '@/components/ui/Dropdown'

import type { UserLog, NotificationTypeDictionaryItem } from '@/@types/notification'



const notificationExpandedHeight = 'h-[280px]'



const _Notification = ({ className }: { className?: string }) => {

    const [notificationList, setNotificationList] = useState<UserLog[]>([])

    const [unreadCount, setUnreadCount] = useState(0)

    const [badgePulseKey, setBadgePulseKey] = useState(0)

    const [initialLoading, setInitialLoading] = useState(false)

    const [loaded, setLoaded] = useState(false)

    const [page, setPage] = useState(1)

    const [hasMore, setHasMore] = useState(false)

    const [notificationTypes, setNotificationTypes] = useState<
        NotificationTypeDictionaryItem[]
    >([])



    const { larger } = useResponsive()

    const navigate = useNavigate()

    const refreshUnreadCount = useCallback(async () => {

        const count = await apiGetUnreadLogsCount()

        setUnreadCount(count)

    }, [])



    useEffect(() => {

        refreshUnreadCount()

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

    const onNotificationOpen = async () => {
        const isFirstLoad = !loaded

        if (isFirstLoad) {
            setInitialLoading(true)
        }

        try {
            let types = notificationTypes

            if (types.length === 0) {
                const dictionaries = await apiGetNotificationDictionaries()
                types = dictionaries.notification_types
                setNotificationTypes(types)
            }

            const [response] = await Promise.all([
                apiGetUserLogs({
                    page: 1,
                    is_unread: true,
                    notificationTypes: types,
                }),
                refreshUnreadCount(),
            ])

            setNotificationList(response.data)
            setHasMore(response.meta.current_page < response.meta.last_page)
            setPage(1)
            setLoaded(true)
        } finally {
            setInitialLoading(false)
        }
    }



    const handleLoadMore = useCallback(async () => {

        const nextPage = page + 1

        const response = await apiGetUserLogs({

            page: nextPage,

            is_unread: true,

            notificationTypes,

        })



        setNotificationList((prevList) => [...prevList, ...response.data])

        setHasMore(response.meta.current_page < response.meta.last_page)

        setPage(nextPage)

    }, [notificationTypes, page])



    const { containerRef, isLoading: loadingMore } = useInfiniteScroll({

        shouldStop: !hasMore || !loaded || initialLoading,

        onLoadMore: handleLoadMore,

    })



    const unreadIds = notificationList

        .filter((item) => !isUserLogRead(item))

        .map((item) => item.id)



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



    const notificationDropdownRef = useRef<DropdownRef>(null)



    const handleViewAllActivity = () => {
        setNotificationList([])
        navigate('/account/notifications')
        notificationDropdownRef.current?.handleDropdownClose()
    }



    const showEmptyState = loaded && notificationList.length === 0



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

                        onClick={onMarkAllAsRead}

                    />

                </div>

            </Dropdown.Item>

            <ScrollBar

                className={classNames('overflow-y-auto', scrollAreaHeight)}

                scrollableNodeProps={{ ref: containerRef }}

            >

                {notificationList.length > 0 &&

                    notificationList.map((item, index) => {
                        const action = item.action
                            ? resolveLogActionHref(item.action.url)
                            : null

                        return (
                        <div key={item.id}>

                            <div

                                className="relative flex cursor-pointer gap-3 rounded-xl border border-transparent px-4 py-3 transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:shadow-md dark:hover:border-primary dark:hover:bg-primary/15"

                                onClick={() => onMarkAsRead(item.id)}

                            >

                                <UserLogAvatar type={item.type} />

                                <div className="min-w-0 flex-1 flex flex-col gap-1.5">

                                    <div className="flex items-start justify-between gap-3">

                                        <p className="font-semibold heading-text min-w-0">

                                            {getUserLogTypeName(item)}

                                        </p>

                                        <Badge

                                            className="mt-1 shrink-0 border-0"

                                            innerClass={getUserLogBadgeInnerClass(item)}

                                        />

                                    </div>

                                    <p className="heading-text text-sm">

                                        {item.message}

                                    </p>

                                    {item.action ? (

                                        <div>

                                            {action?.external ? (

                                                <a

                                                    href={item.action.url}

                                                    target="_blank"

                                                    rel="noreferrer"

                                                    className="text-sm font-medium text-primary hover:underline"

                                                    onClick={(event) =>

                                                        event.stopPropagation()

                                                    }

                                                >

                                                    {item.action.text}

                                                </a>

                                            ) : (

                                                <Link

                                                    to={

                                                        action?.href ||

                                                        item.action.url

                                                    }

                                                    className="text-sm font-medium text-primary hover:underline"

                                                    onClick={(event) =>

                                                        event.stopPropagation()

                                                    }

                                                >

                                                    {item.action.text}

                                                </Link>

                                            )}

                                        </div>

                                    ) : null}

                                    <span className="text-xs text-gray-500 dark:text-gray-400">

                                        {formatUserLogTime(item.created_at)}

                                    </span>

                                </div>

                            </div>

                            {!isLastChild(notificationList, index) ? (

                                <div className="border-b border-gray-200 dark:border-gray-700 my-2" />

                            ) : null}

                        </div>
                        )
                    })}

                {initialLoading && (

                    <div className="px-1 py-2">

                        <NotificationLogSkeleton

                            count={2}

                            showDateGroup={false}

                            compact

                        />

                    </div>

                )}

                {loadingMore && notificationList.length > 0 ? (

                    <div className="flex items-center justify-center py-3">

                        <Spinner size={28} />

                    </div>

                ) : null}

                {showEmptyState && (

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

                            <h6 className="font-semibold">Новых уведомлений нет</h6>

                        </div>

                    </div>

                )}

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


