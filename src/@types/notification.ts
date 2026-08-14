export type NotificationType = {
    value: string
    code?: string
    name: string
}

export type NotificationAction = {
    text: string
    url: string
}

export type UserLogRaw = {
    id: number
    type: number
    message: string
    action?: NotificationAction | null
    read_at: string | null
    created_at: string
}

export type UserLog = {
    id: number
    type: NotificationType
    message: string
    action?: NotificationAction | null
    read_at: string | null
    created_at: string
}

export type UserLogsMeta = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export type UserLogsResponse = {
    data: UserLog[]
    meta: UserLogsMeta
}

export type UserLogsApiResponse = {
    data: UserLogRaw[]
    meta: UserLogsMeta
}

export type MarkUserLogsReadPayload = {
    ids: number[]
}

export type NotificationPreference = {
    type: number
    channel: number
    is_active: boolean
}

export type NotificationPreferencesResponse = {
    data: NotificationPreference[]
}

export type NotificationTypeDictionaryItem = {
    id: number
    code: string
    title: string
    description: string
    default_channels: number[]
}

export type NotificationChannelDictionaryItem = {
    id: number
    code: string
    title: string
}

export type NotificationDictionaries = {
    notification_types: NotificationTypeDictionaryItem[]
    notification_channels: NotificationChannelDictionaryItem[]
}

export type GetUserLogsParams = {
    page?: number
    is_unread?: boolean
    types?: number[]
    notificationTypes?: NotificationTypeDictionaryItem[]
}

export type UpdateNotificationPreferencesPayload = {
    locale: string
    preferences: NotificationPreference[]
}
