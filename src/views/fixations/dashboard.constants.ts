import type { FixationStatus } from './types'

export const FIXATION_STATUS_ORDER: FixationStatus[] = [
    'pending',
    'moderation',
    'fixed',
    'clinch',
    'registration',
    'success',
    'failed',
    'denied',
    'deleted',
    'expired',
]

export const FIXATION_STATUS_COLORS: Record<FixationStatus, string> = {
    pending: '#0ea5e9',
    moderation: '#a855f7',
    denied: '#f43f5e',
    fixed: '#10b981',
    clinch: '#d946ef',
    registration: '#6366f1',
    success: '#14b8a6',
    failed: '#f59e0b',
    deleted: '#6b7280',
    expired: '#ea580c',
}

export type FixationsStatusCounts = Record<FixationStatus, number>

export type FixationsStatusTransition = {
    from: string
    to: string
    fromLabel: string
    toLabel: string
    count: number
}

export type FixationsTransitionTimelinePoint = {
    date: string
    counts: Record<string, number>
}

export type FixationsDashboardStats = {
    dateFrom: string
    dateTo: string
    statusCounts: FixationsStatusCounts
    transitions: FixationsStatusTransition[]
    transitionTimeline: FixationsTransitionTimelinePoint[]
}

export const createEmptyFixationsStatusCounts = (): FixationsStatusCounts =>
    Object.fromEntries(
        FIXATION_STATUS_ORDER.map((status) => [status, 0]),
    ) as FixationsStatusCounts

export const createEmptyFixationsDashboardStats =
    (): FixationsDashboardStats => ({
        dateFrom: '',
        dateTo: '',
        statusCounts: createEmptyFixationsStatusCounts(),
        transitions: [],
        transitionTimeline: [],
    })
