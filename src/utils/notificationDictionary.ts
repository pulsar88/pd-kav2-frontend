import { unwrapApiData, type ApiDataEnvelope } from '@/services/auth/authUtils'
import type {
    NotificationChannelDictionaryItem,
    NotificationDictionaries,
    NotificationTypeDictionaryItem,
    UserLog,
    UserLogRaw,
} from '@/@types/notification'

const TYPE_TITLE_BY_CODE: Record<string, string> = {
    SYSTEM: 'Системные уведомления',
}

const TYPE_DESCRIPTION_BY_CODE: Record<string, string> = {
    SYSTEM: 'Важные сообщения о работе аккаунта и сервиса',
}

const unwrapList = <T>(value: unknown): T[] => {
    if (Array.isArray(value)) {
        return value
    }

    if (
        value &&
        typeof value === 'object' &&
        'data' in value &&
        Array.isArray((value as { data: T[] }).data)
    ) {
        return (value as { data: T[] }).data
    }

    return []
}

const bySort = <T extends { sort?: number; id: number }>(left: T, right: T) =>
    (left.sort ?? 0) - (right.sort ?? 0) || left.id - right.id

export const parseNotificationDictionaries = (
    payload: ApiDataEnvelope<NotificationDictionaries> | NotificationDictionaries,
): NotificationDictionaries => {
    const unwrapped = unwrapApiData(payload)

    if (
        unwrapped &&
        typeof unwrapped === 'object' &&
        'notification_types' in unwrapped &&
        'notification_channels' in unwrapped
    ) {
        return {
            notification_types: unwrapList<NotificationTypeDictionaryItem>(
                unwrapped.notification_types,
            ).sort(bySort),
            notification_channels: unwrapList<NotificationChannelDictionaryItem>(
                unwrapped.notification_channels,
            ).sort(bySort),
        }
    }

    return {
        notification_types: [],
        notification_channels: [],
    }
}

export const formatNotificationTypeTitle = (
    type: NotificationTypeDictionaryItem,
) => {
    if (type.title && !type.title.includes('::')) {
        return type.title
    }

    return TYPE_TITLE_BY_CODE[type.code] ?? type.code
}

export const formatNotificationTypeDescription = (
    type: NotificationTypeDictionaryItem,
) => {
    if (type.description && !type.description.includes('::')) {
        return type.description
    }

    return TYPE_DESCRIPTION_BY_CODE[type.code] ?? ''
}

export const formatNotificationChannelTitle = (
    channel: NotificationChannelDictionaryItem,
) => channel.title || channel.code

export const getUserLogTypeId = (log: UserLog | UserLogRaw) =>
    typeof log.type === 'number' ? log.type : Number(log.type.value)

export const getUserLogTypeName = (log: UserLog) => log.type.name

export const normalizeUserLog = (
    log: UserLogRaw,
    types?: NotificationTypeDictionaryItem[],
): UserLog => {
    const dictionaryType = types?.find((type) => type.id === log.type)

    return {
        ...log,
        type: {
            value: String(log.type),
            code: dictionaryType?.code,
            name: dictionaryType
                ? formatNotificationTypeTitle(dictionaryType)
                : 'Уведомление',
        },
    }
}

export const normalizeUserLogs = (
    logs: UserLogRaw[],
    types?: NotificationTypeDictionaryItem[],
) => logs.map((log) => normalizeUserLog(log, types))

export const logMatchesNotificationType = (
    log: UserLog | UserLogRaw,
    type: NotificationTypeDictionaryItem,
) => getUserLogTypeId(log) === type.id

export const filterLogsByNotificationTypes = (
    logs: UserLog[],
    selectedTypeIds: number[],
) => {
    if (selectedTypeIds.length === 0) {
        return logs
    }

    return logs.filter((log) =>
        selectedTypeIds.includes(getUserLogTypeId(log)),
    )
}

export const buildNotificationTypeFilterItems = (
    types: NotificationTypeDictionaryItem[],
) =>
    types.map((type) => ({
        label: formatNotificationTypeTitle(type),
        value: String(type.id),
    }))
