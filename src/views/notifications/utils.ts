import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { UserLog } from '@/@types/notification'

dayjs.locale('ru')

export type UserLogGroup = {
    label: string
    dateKey: string
    items: UserLog[]
}

export const isUserLogRead = (log: UserLog) => Boolean(log.read_at)

export const isSystemNotificationType = (type?: UserLog['type'] | null) => {
    if (!type) {
        return false
    }

    const code = type.code?.toUpperCase()

    if (code === 'SYSTEM') {
        return true
    }

    return type.name === 'Системные уведомления'
}

export const isSystemUserLog = (log: UserLog) =>
    isSystemNotificationType(log.type)

export const getUserLogBadgeInnerClass = (log: UserLog) =>
    isUserLogRead(log)
        ? 'bg-gray-300 dark:bg-gray-500'
        : 'bg-emerald-500'

export const formatUserLogTime = (value: string) =>
    dayjs(value).format('HH:mm')

export const formatUserLogReadTime = (value: string) => {
    const readAt = dayjs(value)
    const today = dayjs().startOf('day')

    if (readAt.isSame(today, 'day')) {
        return readAt.format('HH:mm')
    }

    return readAt.format('DD.MM.YYYY HH:mm')
}

export const formatDateGroupLabel = (dateKey: string) => {
    const date = dayjs(dateKey)
    const today = dayjs().startOf('day')
    const yesterday = today.subtract(1, 'day')

    if (date.isSame(today, 'day')) {
        return 'Сегодня'
    }

    if (date.isSame(yesterday, 'day')) {
        return 'Вчера'
    }

    return date.format('dddd, DD MMMM')
}

export const groupUserLogsByDate = (logs: UserLog[]): UserLogGroup[] => {
    const groups = new Map<string, UserLog[]>()

    logs.forEach((log) => {
        const dateKey = dayjs(log.created_at).format('YYYY-MM-DD')
        const bucket = groups.get(dateKey) ?? []
        bucket.push(log)
        groups.set(dateKey, bucket)
    })

    return Array.from(groups.entries())
        .sort(([left], [right]) => right.localeCompare(left))
        .map(([dateKey, items]) => ({
            dateKey,
            label: formatDateGroupLabel(dateKey),
            items: items.sort(
                (left, right) =>
                    dayjs(right.created_at).valueOf() -
                    dayjs(left.created_at).valueOf(),
            ),
        }))
}

export const resolveLogActionHref = (url: string) => {
    try {
        const parsed = new URL(url, window.location.origin)
        if (parsed.origin !== window.location.origin) {
            return { external: true, href: url }
        }

        return {
            external: false,
            href: `${parsed.pathname}${parsed.search}${parsed.hash}`,
        }
    } catch {
        return { external: false, href: url }
    }
}

export const markUserLogsAsReadLocal = (
    logs: UserLog[],
    ids: number[],
    readAt = new Date().toISOString(),
) =>
    logs.map((log) =>
        ids.includes(log.id) ? { ...log, read_at: readAt } : log,
    )
