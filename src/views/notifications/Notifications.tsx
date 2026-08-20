import { useCallback, useEffect, useMemo, useState } from 'react'

import AdaptiveCard from '@/components/shared/AdaptiveCard'

import Log from './components/Log'

import LogAction from './components/LogAction'

import {

    apiGetNotificationDictionaries,

    apiGetUserLogs,

    apiMarkUserLogsAsRead,

} from '@/services/NotificationService'

import { buildNotificationTypeFilterItems, getUserLogTypeId } from '@/utils/notificationDictionary'

import { registerUserLogsBroadcastHandlers, emitUserLogsSynced } from '@/services/broadcast/userLogsBroadcastBus'

import { isUserLogRead, markUserLogsAsReadLocal } from './utils'

import type {

    NotificationTypeDictionaryItem,

    UserLog,

    UserLogsMeta,

} from '@/@types/notification'



const Notifications = () => {

    const [isLoading, setIsLoading] = useState(true)

    const [logs, setLogs] = useState<UserLog[]>([])

    const [meta, setMeta] = useState<UserLogsMeta | null>(null)

    const [page, setPage] = useState(1)

    const [notificationTypes, setNotificationTypes] = useState<

        NotificationTypeDictionaryItem[]

    >([])

    const [selectedFilters, setSelectedFilters] = useState<string[]>([])

    const [initialized, setInitialized] = useState(false)



    const filterItems = useMemo(

        () => buildNotificationTypeFilterItems(notificationTypes),

        [notificationTypes],

    )



    const selectedTypeIds = useMemo(

        () => selectedFilters.map(Number).filter(Number.isFinite),

        [selectedFilters],

    )



    const fetchLogs = useCallback(

        async (

            pageNumber: number,

            append = false,

            typeIds = selectedTypeIds,

            dictionaryTypes = notificationTypes,

        ) => {

            setIsLoading(true)

            try {

                const response = await apiGetUserLogs({

                    page: pageNumber,

                    types: typeIds.length > 0 ? typeIds : undefined,

                    notificationTypes: dictionaryTypes,

                })

                setLogs((prevLogs) =>

                    append ? [...prevLogs, ...response.data] : response.data,

                )

                setMeta(response.meta)

                if (pageNumber === 1 && !append) {
                    emitUserLogsSynced()
                }

            } finally {

                setIsLoading(false)

            }

        },

        [notificationTypes, selectedTypeIds],

    )



    useEffect(() => {

        const loadInitialData = async () => {

            const dictionaries = await apiGetNotificationDictionaries()

            const types = dictionaries.notification_types

            const defaultFilters = types.map((type) => String(type.id))



            setNotificationTypes(types)

            setSelectedFilters(defaultFilters)

            setInitialized(true)

        }



        loadInitialData()

    }, [])



    useEffect(() => {

        if (!initialized) {

            return

        }



        setPage(1)

        fetchLogs(1, false, selectedTypeIds)

    }, [initialized, selectedTypeIds, fetchLogs])



    useEffect(() => {
        return registerUserLogsBroadcastHandlers({
            onLogCreated: (log) => {
                setLogs((prevLogs) => {
                    if (prevLogs.some((item) => item.id === log.id)) {
                        return prevLogs
                    }

                    if (
                        selectedTypeIds.length > 0 &&
                        !selectedTypeIds.includes(getUserLogTypeId(log))
                    ) {
                        return prevLogs
                    }

                    return [log, ...prevLogs]
                })
            },
            onLogsReaded: (ids) => {
                setLogs((prevLogs) => markUserLogsAsReadLocal(prevLogs, ids))
            },
        })
    }, [selectedTypeIds])



    const loadable = Boolean(meta && meta.current_page < meta.last_page)



    const handleLoadMore = useCallback(async () => {
        if (!loadable || isLoading) {
            return
        }

        const nextPage = page + 1
        setPage(nextPage)
        await fetchLogs(nextPage, true)
    }, [fetchLogs, isLoading, loadable, page])



    const handleMarkAsRead = async (id: number) => {

        const target = logs.find((log) => log.id === id)

        if (!target || isUserLogRead(target)) {

            return

        }



        await apiMarkUserLogsAsRead({ ids: [id] })

        setLogs((prevLogs) => markUserLogsAsReadLocal(prevLogs, [id]))

    }



    const handleFilterChange = (value: string) => {

        if (selectedFilters.includes(value)) {

            setSelectedFilters((prevFilters) =>

                prevFilters.filter((item) => item !== value),

            )

            return

        }



        setSelectedFilters((prevFilters) => [...prevFilters, value])

    }



    return (

        <AdaptiveCard>

            <div className="max-w-[800px] mx-auto">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

                    <h3>Уведомления</h3>

                    {filterItems.length > 0 ? (

                        <LogAction

                            filterItems={filterItems}

                            selectedFilters={selectedFilters}

                            onFilterChange={handleFilterChange}

                        />

                    ) : null}

                </div>

                <Log

                    logs={logs}

                    isLoading={isLoading}

                    loadable={loadable}

                    onLoadMore={handleLoadMore}

                    onMarkAsRead={handleMarkAsRead}

                />

            </div>

        </AdaptiveCard>

    )

}



export default Notifications


