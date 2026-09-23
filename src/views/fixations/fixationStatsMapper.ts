import dayjs from 'dayjs'
import type { FixationStatus } from './types'
import type {
    FixationsStatusCounts,
    FixationsStatusTimelinePoint,
    FixationsStatusTransition,
} from './dashboard.constants'
import {
    FIXATION_STATUS_ORDER,
    createEmptyFixationsStatusCounts,
} from './dashboard.constants'
import { fixationStatusMap } from './utils'

type FixationStatsEvent = {
    meta?: unknown
    created_at?: string
}

type StatusRef = {
    value?: string
    code?: string
    name?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const readStatusRef = (raw: unknown): StatusRef | null => {
    if (typeof raw === 'string' && raw.trim()) {
        return { value: raw.trim().toLowerCase(), name: raw.trim() }
    }

    if (!isRecord(raw)) return null

    const value =
        typeof raw.value === 'string'
            ? raw.value
            : typeof raw.code === 'string'
              ? raw.code
              : undefined
    const name = typeof raw.name === 'string' ? raw.name : undefined

    if (!value && !name) return null

    return {
        value: value?.toLowerCase(),
        code: typeof raw.code === 'string' ? raw.code : undefined,
        name,
    }
}

const resolveStatusLabel = (status: StatusRef): string => {
    const key = (status.value || '').toLowerCase() as FixationStatus
    if (key && fixationStatusMap[key]) {
        return fixationStatusMap[key].label
    }
    return status.name || status.value || status.code || 'Неизвестно'
}

const extractStatusChange = (
    item: FixationStatsEvent,
): { from: StatusRef; to: StatusRef } | null => {
    const meta = item.meta
    if (!isRecord(meta)) return null

    const oldStatus = readStatusRef(
        isRecord(meta.old) ? meta.old.status : undefined,
    )
    const newStatus = readStatusRef(
        isRecord(meta.attributes) ? meta.attributes.status : undefined,
    )

    if (!oldStatus || !newStatus) return null

    return { from: oldStatus, to: newStatus }
}

export const formatStatsApiDate = (date: Date) =>
    dayjs(date).format('DD.MM.YYYY')

export const getDefaultFixationsStatsDateRange = (): [Date, Date] => {
    const today = dayjs().startOf('day').toDate()
    const from = dayjs().startOf('month').toDate()
    return [from, today]
}

export const parseStatsApiDate = (value: string) => {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim())
    if (!match) return null

    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    const date = new Date(year, month - 1, day)

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null
    }

    return date
}

/** @deprecated transition pairs chart removed; kept for rare callers */
export const mapFixationsStatsToTransitions = (
    items: FixationStatsEvent[],
): FixationsStatusTransition[] => {
    const counts = new Map<
        string,
        {
            from: string
            to: string
            fromLabel: string
            toLabel: string
            count: number
        }
    >()

    items.forEach((item) => {
        const change = extractStatusChange(item)
        if (!change) return

        const from = (
            change.from.value ||
            change.from.name ||
            'unknown'
        ).toLowerCase()
        const to = (
            change.to.value ||
            change.to.name ||
            'unknown'
        ).toLowerCase()
        const key = `${from}→${to}`
        const existing = counts.get(key)

        if (existing) {
            existing.count += 1
            return
        }

        counts.set(key, {
            from,
            to,
            fromLabel: resolveStatusLabel(change.from),
            toLabel: resolveStatusLabel(change.to),
            count: 1,
        })
    })

    return Array.from(counts.values()).sort((a, b) => b.count - a.count)
}

const buildDateKeys = (dateFrom: Date, dateTo: Date) => {
    const keys: string[] = []
    let cursor = dayjs(dateFrom).startOf('day')
    const end = dayjs(dateTo).startOf('day')

    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
        keys.push(cursor.format('YYYY-MM-DD'))
        cursor = cursor.add(1, 'day')
    }

    return keys
}

const isKnownFixationStatus = (value: string): value is FixationStatus =>
    value in fixationStatusMap

/**
 * По дням суммирует конечный статус перехода (to) накопительным итогом:
 * значение на дату = сумма за все дни с начала периода по эту дату включительно.
 */
export const mapFixationsStatsToFinalStatusTimeline = (
    items: FixationStatsEvent[],
    dateFrom: Date,
    dateTo: Date,
): FixationsStatusTimelinePoint[] => {
    const dateKeys = buildDateKeys(dateFrom, dateTo)
    const dayCounts = new Map<string, FixationsStatusCounts>()

    dateKeys.forEach((key) => {
        dayCounts.set(key, createEmptyFixationsStatusCounts())
    })

    items.forEach((item) => {
        const change = extractStatusChange(item)
        if (!change || !item.created_at) return

        const dayKey = dayjs(item.created_at).format('YYYY-MM-DD')
        const day = dayCounts.get(dayKey)
        if (!day) return

        const toKey = (change.to.value || change.to.name || '').toLowerCase()
        if (!isKnownFixationStatus(toKey)) return

        day[toKey] += 1
    })

    const running = createEmptyFixationsStatusCounts()

    return dateKeys.map((date) => {
        const day = dayCounts.get(date) ?? createEmptyFixationsStatusCounts()
        FIXATION_STATUS_ORDER.forEach((status) => {
            running[status] += day[status]
        })
        return {
            date,
            counts: { ...running },
        }
    })
}

export const getActiveStatusesFromTimeline = (
    timeline: FixationsStatusTimelinePoint[],
): FixationStatus[] =>
    FIXATION_STATUS_ORDER.filter((status) =>
        timeline.some((point) => (point.counts[status] ?? 0) > 0),
    )

export type FixationsStatsStatusApiItem = {
    status?: {
        value?: string
        code?: string
        name?: string
    }
    total?: number
    data?: {
        status?: {
            value?: string
            code?: string
            name?: string
        }
        total?: number
    }
}

export const mapFixationsStatsStatusesToCounts = (
    items: FixationsStatsStatusApiItem[],
): FixationsStatusCounts => {
    const counts = createEmptyFixationsStatusCounts()

    items.forEach((item) => {
        const statusRef = readStatusRef(item.status ?? item.data?.status)
        if (!statusRef?.value) return

        const key = statusRef.value.toLowerCase()
        if (!isKnownFixationStatus(key)) return

        const total = item.total ?? item.data?.total ?? 0
        counts[key] = Number.isFinite(total) ? Math.max(0, Number(total)) : 0
    })

    return counts
}
