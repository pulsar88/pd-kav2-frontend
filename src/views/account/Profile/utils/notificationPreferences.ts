import type {
    NotificationChannelDictionaryItem,
    NotificationPreference,
    NotificationTypeDictionaryItem,
} from '@/@types/notification'
import {
    formatNotificationTypeDescription,
    formatNotificationTypeTitle,
} from '@/utils/notificationDictionary'

export { formatNotificationTypeDescription, formatNotificationTypeTitle }

export const getPreferenceKey = (typeId: number, channelId: number) =>
    `${typeId}:${channelId}`

export const isChannelHiddenForType = (
    type: NotificationTypeDictionaryItem,
    channel: NotificationChannelDictionaryItem,
) =>
    Boolean(channel.is_hidden) ||
    (type.hidden_channels ?? []).includes(channel.id)

export const isChannelReadonlyForType = (
    type: NotificationTypeDictionaryItem,
    channel: NotificationChannelDictionaryItem,
) =>
    isChannelHiddenForType(type, channel) ||
    (type.readonly_channels ?? []).includes(channel.id)

export const visibleChannelsForType = (
    type: NotificationTypeDictionaryItem,
    channels: NotificationChannelDictionaryItem[],
) => channels.filter((channel) => !isChannelHiddenForType(type, channel))

export const buildPreferenceState = (
    types: NotificationTypeDictionaryItem[],
    channels: NotificationChannelDictionaryItem[],
    preferences: NotificationPreference[],
) => {
    const state: Record<string, boolean> = {}

    types.forEach((type) => {
        visibleChannelsForType(type, channels).forEach((channel) => {
            const key = getPreferenceKey(type.id, channel.id)
            const preference = preferences.find(
                (item) =>
                    item.type === type.id && item.channel === channel.id,
            )

            state[key] =
                preference?.is_active ??
                type.default_channels.includes(channel.id)
        })
    })

    return state
}

export const preferenceStateToPayload = (
    state: Record<string, boolean>,
): NotificationPreference[] =>
    Object.entries(state).map(([key, is_active]) => {
        const [type, channel] = key.split(':').map(Number)
        return { type, channel, is_active }
    })

export const arePreferenceStatesEqual = (
    left: Record<string, boolean>,
    right: Record<string, boolean>,
) => {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])

    for (const key of keys) {
        if (left[key] !== right[key]) {
            return false
        }
    }

    return true
}
