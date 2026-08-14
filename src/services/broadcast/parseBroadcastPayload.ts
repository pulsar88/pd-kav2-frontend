import type {
    UserLogsCreatedBroadcastPayload,
    UserLogsReadedBroadcastPayload,
} from '@/@types/broadcast'
import type { NotificationAction, UserLogRaw } from '@/@types/notification'

const isUserLogRaw = (value: unknown): value is UserLogRaw =>
    Boolean(
        value &&
            typeof value === 'object' &&
            typeof (value as UserLogRaw).id === 'number' &&
            typeof (value as UserLogRaw).type === 'number' &&
            typeof (value as UserLogRaw).message === 'string' &&
            typeof (value as UserLogRaw).created_at === 'string',
    )

const normalizeAction = (action: unknown): NotificationAction | null => {
    if (!action || typeof action !== 'object') {
        return null
    }

    const candidate = action as NotificationAction

    if (
        typeof candidate.text === 'string' &&
        typeof candidate.url === 'string'
    ) {
        return candidate
    }

    return null
}

export const parseUserLogCreatedPayload = (
    payload: unknown,
): UserLogRaw | null => {
    if (!payload || typeof payload !== 'object') {
        return null
    }

    const data = payload as UserLogsCreatedBroadcastPayload

    if (isUserLogRaw(data.log)) {
        return data.log
    }

    if (isUserLogRaw(data.user_log)) {
        return data.user_log
    }

    if (isUserLogRaw(data)) {
        return data
    }

    return null
}

export const parseUserLogsReadedPayload = (payload: unknown): number[] => {
    if (!payload || typeof payload !== 'object') {
        return []
    }

    const data = payload as UserLogsReadedBroadcastPayload
    const ids = data.ids ?? data.log_ids ?? data.user_log_ids

    if (!Array.isArray(ids)) {
        return []
    }

    return ids.map(Number).filter(Number.isFinite)
}
