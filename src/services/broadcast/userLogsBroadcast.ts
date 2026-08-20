import broadcastConfig from '@/configs/broadcast.config'
import { normalizeUserLog } from '@/utils/notificationDictionary'
import { apiGetNotificationDictionaries } from '@/services/NotificationService'
import type { NotificationTypeDictionaryItem } from '@/@types/notification'
import { getEcho } from './echo'
import {
    parseUserLogCreatedPayload,
    parseUserLogsReadedPayload,
} from './parseBroadcastPayload'
import {
    emitUserLogCreated,
    emitUserLogsReaded,
} from './userLogsBroadcastBus'

// Echo prepends the default namespace "App.Events" — use short class names only.
export const USER_LOGS_CREATED_EVENT = 'UserLogsCreatedEvent'
export const USER_LOGS_READED_EVENT = 'UserLogsReadedEvent'
const getPrivateUserChannelName = (userId: string | number) => `user.${userId}`

export const subscribeUserLogsBroadcast = (userId: string | number) => {
    if (!broadcastConfig.enabled) {
        return () => undefined
    }

    const echo = getEcho()
    const channelName = getPrivateUserChannelName(userId)
    const channel = echo.private(channelName)

    let notificationTypes: NotificationTypeDictionaryItem[] = []

    void apiGetNotificationDictionaries().then((dictionaries) => {
        notificationTypes = dictionaries.notification_types
    })

    const handleCreated = (payload: unknown) => {
        const rawLog = parseUserLogCreatedPayload(payload)

        if (!rawLog) {
            return
        }

        emitUserLogCreated(normalizeUserLog(rawLog, notificationTypes))
    }

    const handleReaded = (payload: unknown) => {
        const ids = parseUserLogsReadedPayload(payload)

        if (ids.length === 0) {
            return
        }

        emitUserLogsReaded(ids)
    }

    channel
        .listen(USER_LOGS_CREATED_EVENT, handleCreated)
        .listen(USER_LOGS_READED_EVENT, handleReaded)

    return () => {
        channel.stopListening(USER_LOGS_CREATED_EVENT, handleCreated)
        channel.stopListening(USER_LOGS_READED_EVENT, handleReaded)
        echo.leave(channelName)
    }
}
