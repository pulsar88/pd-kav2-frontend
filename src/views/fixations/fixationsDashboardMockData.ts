import {
    FIXATION_STATUS_ORDER,
    formatFixationsDashboardMonthLabel,
    type FixationsDashboardMonth,
    type FixationsDashboardStats,
    type FixationsStatusCounts,
    type FixationsTimelinePoint,
} from '@/views/fixations/dashboard.constants'

const AVAILABLE_MONTH_VALUES = [
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
]

const seededRandom = (seed: number) => {
    let state = seed

    return () => {
        state = (state * 16807) % 2147483647
        return (state - 1) / 2147483646
    }
}

const getDaysInMonth = (monthValue: string) => {
    const [year, month] = monthValue.split('-').map(Number)
    return new Date(year, month, 0).getDate()
}

const buildMonthStats = (
    monthValue: string,
    seed: number,
): Pick<FixationsDashboardStats, 'statusCounts' | 'timeline'> => {
    const rand = seededRandom(seed)
    const daysInMonth = getDaysInMonth(monthValue)

    const endCounts: FixationsStatusCounts = {
        pending: Math.floor(rand() * 6) + 3,
        fixed: Math.floor(rand() * 14) + 10,
        registration: Math.floor(rand() * 5) + 2,
        success: Math.floor(rand() * 8) + 4,
        failed: Math.floor(rand() * 9) + 4,
        denied: Math.floor(rand() * 5) + 2,
        deleted: Math.floor(rand() * 3) + 1,
    }

    const timeline: FixationsTimelinePoint[] = []

    for (let day = 1; day <= daysInMonth; day += 1) {
        const progress = day / daysInMonth
        const date = `${monthValue}-${String(day).padStart(2, '0')}`
        const counts = {} as FixationsStatusCounts

        FIXATION_STATUS_ORDER.forEach((status) => {
            const target = endCounts[status]
            const startFactor =
                status === 'fixed' || status === 'success'
                    ? 0.55
                    : status === 'failed' || status === 'pending'
                      ? 0.7
                      : 0.35
            const base = Math.max(
                0,
                Math.round(target * (startFactor + (1 - startFactor) * progress)),
            )
            const noise = Math.floor((rand() - 0.5) * 3)
            counts[status] = Math.max(0, base + noise)
        })

        timeline.push({ date, counts })
    }

    timeline[timeline.length - 1].counts = { ...endCounts }

    return {
        statusCounts: endCounts,
        timeline,
    }
}

const monthStatsCache = Object.fromEntries(
    AVAILABLE_MONTH_VALUES.map((month, index) => [
        month,
        buildMonthStats(month, 1000 + index * 137),
    ]),
)

export const availableFixationsDashboardMonths: FixationsDashboardMonth[] =
    AVAILABLE_MONTH_VALUES.map((value) => ({
        value,
        label: formatFixationsDashboardMonthLabel(value),
    }))

export const defaultFixationsDashboardMonth =
    AVAILABLE_MONTH_VALUES[AVAILABLE_MONTH_VALUES.length - 1]

export function getFixationsDashboardStats(
    month: string,
): FixationsDashboardStats {
    const resolvedMonth = monthStatsCache[month]
        ? month
        : defaultFixationsDashboardMonth

    const stats = monthStatsCache[resolvedMonth]

    return {
        month: resolvedMonth,
        statusCounts: stats.statusCounts,
        timeline: stats.timeline,
        availableMonths: availableFixationsDashboardMonths,
    }
}
