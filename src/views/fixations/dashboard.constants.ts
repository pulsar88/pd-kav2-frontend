import type { FixationStatus } from './types'

export const FIXATION_STATUS_ORDER: FixationStatus[] = [
    'pending',
    'fixed',
    'registration',
    'success',
    'failed',
    'denied',
    'deleted',
]

export const FIXATION_STATUS_COLORS: Record<FixationStatus, string> = {
    pending: '#0ea5e9',
    denied: '#f43f5e',
    fixed: '#10b981',
    registration: '#6366f1',
    success: '#14b8a6',
    failed: '#f59e0b',
    deleted: '#6b7280',
}

export type FixationsStatusCounts = Record<FixationStatus, number>

export type FixationsTimelinePoint = {
    date: string
    counts: FixationsStatusCounts
}

export type FixationsDashboardMonth = {
    value: string
    label: string
}

export type FixationsDashboardStats = {
    month: string
    statusCounts: FixationsStatusCounts
    timeline: FixationsTimelinePoint[]
    availableMonths: FixationsDashboardMonth[]
}

const MONTH_LABELS = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
]

export const formatFixationsDashboardMonthLabel = (value: string) => {
    const [year, month] = value.split('-').map(Number)
    return `${MONTH_LABELS[month - 1]} ${year}`
}

export const getCurrentFixationsDashboardMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const defaultFixationsDashboardMonth =
    getCurrentFixationsDashboardMonth()

export const createEmptyFixationsStatusCounts = (): FixationsStatusCounts =>
    Object.fromEntries(
        FIXATION_STATUS_ORDER.map((status) => [status, 0]),
    ) as FixationsStatusCounts

export const createEmptyFixationsDashboardStats = (
    month: string = defaultFixationsDashboardMonth,
): FixationsDashboardStats => ({
    month,
    statusCounts: createEmptyFixationsStatusCounts(),
    timeline: [],
    availableMonths: [
        {
            value: month,
            label: formatFixationsDashboardMonthLabel(month),
        },
    ],
})
