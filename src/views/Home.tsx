import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import useSWR from 'swr'
import {
    TbBell,
    TbBriefcase,
    TbBuilding,
    TbHelp,
    TbPhone,
    TbSettings,
    TbUser,
} from 'react-icons/tb'
import type { ApexOptions } from 'apexcharts'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Chart from '@/components/shared/Chart'
import Container from '@/components/shared/Container'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import type { DatePickerRangeValue } from '@/components/ui/DatePicker'
import Spinner from '@/components/ui/Spinner'
import Tooltip from '@/components/ui/Tooltip'
import classNames from '@/utils/classNames'
import { useSessionUser } from '@/store/authStore'
import useResponsive from '@/utils/hooks/useResponsive'
import { mapUserToProfileForm } from '@/views/account/Profile/utils'
import {
    apiGetNotificationDictionaries,
    apiGetUserLogs,
} from '@/services/NotificationService'
import {
    apiGetFixationsStatusCounts,
    apiGetFixationsTransitionStats,
} from '@/services/FixationsService'
import {
    FIXATION_STATUS_COLORS,
    FIXATION_STATUS_ORDER,
    createEmptyFixationsStatusCounts,
} from '@/views/fixations/dashboard.constants'
import {
    formatStatsApiDate,
    getDefaultFixationsStatsDateRange,
} from '@/views/fixations/fixationStatsMapper'
import { fixationStatusMap } from '@/views/fixations/utils'
import type { FixationStatus } from '@/views/fixations/types'
import {
    formatUserLogTime,
    isUserLogRead,
    resolveLogActionHref,
} from '@/views/notifications/utils'
import { getUserLogTypeName } from '@/utils/notificationDictionary'
import UserLogAvatar from '@/views/notifications/components/UserLogAvatar'
import type { UserLog } from '@/@types/notification'
import DashboardAnalyticsFilters, {
    getDashboardAnalyticsScope,
} from '@/views/Home/DashboardAnalyticsFilters'

const Home = () => {
    const navigate = useNavigate()
    const { larger } = useResponsive()
    const user = useSessionUser((state) => state.user)
    const profile = useMemo(() => mapUserToProfileForm(user), [user])
    const isDesktop = Boolean(larger.lg)
    const analyticsScope = useMemo(
        () => getDashboardAnalyticsScope(user.authority ?? []),
        [user.authority],
    )

    const [statusesDateRange, setStatusesDateRange] =
        useState<DatePickerRangeValue>(() =>
            getDefaultFixationsStatsDateRange(),
        )
    const [transitionsDateRange, setTransitionsDateRange] =
        useState<DatePickerRangeValue>(() =>
            getDefaultFixationsStatsDateRange(),
        )
    const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(
        () =>
            analyticsScope.isAgencySupervisor
                ? (user.agency?.id ?? null)
                : null,
    )
    const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
    const [notifications, setNotifications] = useState<UserLog[]>([])
    const [isNotificationsLoading, setIsNotificationsLoading] = useState(true)

    useEffect(() => {
        if (
            analyticsScope.isAgencySupervisor &&
            user.agency?.id &&
            selectedAgencyId == null
        ) {
            setSelectedAgencyId(user.agency.id)
        }
    }, [analyticsScope.isAgencySupervisor, selectedAgencyId, user.agency?.id])

    const agentIdParam = useMemo(() => {
        if (!analyticsScope.canSelectAgent) return undefined
        return selectedAgentId ?? undefined
    }, [analyticsScope.canSelectAgent, selectedAgentId])

    const canLoadAnalytics =
        !analyticsScope.canSelectAgent || selectedAgentId != null

    const statusesRange = useMemo(() => {
        if (!canLoadAnalytics) return null
        const [from, to] = statusesDateRange
        if (!(from instanceof Date) || !(to instanceof Date)) return null
        return {
            date_from: formatStatsApiDate(from),
            date_to: formatStatsApiDate(to),
            agent_id: agentIdParam,
        }
    }, [agentIdParam, canLoadAnalytics, statusesDateRange])

    const transitionsRange = useMemo(() => {
        if (!canLoadAnalytics) return null
        const [from, to] = transitionsDateRange
        if (!(from instanceof Date) || !(to instanceof Date)) return null
        return {
            date_from: formatStatsApiDate(from),
            date_to: formatStatsApiDate(to),
            agent_id: agentIdParam,
        }
    }, [agentIdParam, canLoadAnalytics, transitionsDateRange])

    const {
        data: statusCounts,
        isLoading: isStatusesLoading,
        isValidating: isStatusesValidating,
    } = useSWR(
        statusesRange
            ? [
                  'fixations-status-counts',
                  statusesRange.date_from,
                  statusesRange.date_to,
                  statusesRange.agent_id ?? null,
              ]
            : null,
        () => apiGetFixationsStatusCounts(statusesRange!),
        {
            keepPreviousData: true,
        },
    )

    const {
        data: transitionsData,
        isLoading: isTransitionsLoading,
        isValidating: isTransitionsValidating,
    } = useSWR(
        transitionsRange
            ? [
                  'fixations-transitions',
                  transitionsRange.date_from,
                  transitionsRange.date_to,
                  transitionsRange.agent_id ?? null,
              ]
            : null,
        () => apiGetFixationsTransitionStats(transitionsRange!),
        {
            keepPreviousData: true,
        },
    )

    const handleDateRangeChange =
        (setter: (value: DatePickerRangeValue) => void) =>
        (value: DatePickerRangeValue) => {
            if (value?.[0] instanceof Date && value?.[1] instanceof Date) {
                setter(value)
                return
            }
            if (!value?.[0] && !value?.[1]) {
                setter(getDefaultFixationsStatsDateRange())
            }
        }

    useEffect(() => {
        let cancelled = false
        setIsNotificationsLoading(true)

        void apiGetNotificationDictionaries()
            .then((dictionaries) =>
                apiGetUserLogs({
                    page: 1,
                    per_page: 3,
                    set_read: false,
                    notificationTypes: dictionaries.notification_types,
                }),
            )
            .then((response) => {
                if (!cancelled) {
                    setNotifications(response.data)
                }
            })
            .catch(() => {
                if (!cancelled) setNotifications([])
            })
            .finally(() => {
                if (!cancelled) setIsNotificationsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const statusSummary = useMemo(() => {
        const counts = statusCounts ?? createEmptyFixationsStatusCounts()

        return FIXATION_STATUS_ORDER.map((status: FixationStatus) => ({
            status,
            label: fixationStatusMap[status].label,
            count: counts[status] ?? 0,
            color: FIXATION_STATUS_COLORS[status],
        }))
    }, [statusCounts])

    const donutSeries = useMemo(
        () => statusSummary.map((item) => item.count),
        [statusSummary],
    )

    const totalFixations = useMemo(
        () => donutSeries.reduce((sum, value) => sum + value, 0),
        [donutSeries],
    )

    const donutOptions = useMemo<ApexOptions>(
        () => ({
            labels: statusSummary.map((item) => item.label),
            colors: statusSummary.map((item) => item.color),
            legend: {
                show: false,
            },
            dataLabels: {
                enabled: false,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '72%',
                    },
                },
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} шт.`,
                },
            },
            chart: {
                events: {
                    dataPointSelection: (_event, _ctx, config) => {
                        const item = statusSummary[config.dataPointIndex]
                        if (item) {
                            navigate(`/fixations?status=${item.status}`)
                        }
                    },
                },
            },
        }),
        [navigate, statusSummary],
    )

    const transitions = useMemo(
        () => transitionsData?.transitions ?? [],
        [transitionsData?.transitions],
    )

    const transitionTimeline = useMemo(
        () => transitionsData?.transitionTimeline ?? [],
        [transitionsData?.transitionTimeline],
    )

    const transitionCategories = useMemo(
        () =>
            transitionTimeline.map((point) => {
                const [, month, day] = point.date.split('-')
                return `${Number(day)}.${month}`
            }),
        [transitionTimeline],
    )

    const transitionSeries = useMemo(
        () =>
            transitions.map((item) => {
                const key = `${item.from}→${item.to}`
                return {
                    name: `${item.fromLabel} → ${item.toLabel}`,
                    data: transitionTimeline.map(
                        (point) => point.counts[key] ?? 0,
                    ),
                }
            }),
        [transitionTimeline, transitions],
    )

    const transitionColors = useMemo(
        () =>
            transitions.map(
                (item) =>
                    FIXATION_STATUS_COLORS[item.to as FixationStatus] ??
                    '#6b7280',
            ),
        [transitions],
    )

    const transitionOptions = useMemo<ApexOptions>(
        () => ({
            colors: transitionColors,
            chart: {
                type: 'line',
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
                background: 'transparent',
            },
            stroke: {
                show: true,
                curve: 'smooth',
                width: 3,
                lineCap: 'round',
                colors: transitionColors,
            },
            legend: {
                show: true,
                position: 'bottom',
                horizontalAlign: 'left',
            },
            markers: {
                size: 4,
                strokeWidth: 0,
                colors: transitionColors,
                hover: {
                    size: 6,
                },
            },
            dataLabels: {
                enabled: false,
            },
            grid: {
                strokeDashArray: 4,
                borderColor: 'rgba(148, 163, 184, 0.25)',
            },
            xaxis: {
                title: {
                    text: 'Дата',
                },
                labels: {
                    rotate: transitionCategories.length > 20 ? -45 : 0,
                    hideOverlappingLabels: false,
                },
                tickPlacement: 'on',
            },
            yaxis: {
                title: {
                    text: 'Количество переходов',
                },
                min: 0,
                forceNiceScale: true,
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: (value) => `${value} шт.`,
                },
            },
        }),
        [transitionCategories.length, transitionColors],
    )

    const transitionChartMinWidth = useMemo(() => {
        const perDayPx = 56
        return Math.max(480, transitionCategories.length * perDayPx)
    }, [transitionCategories.length])

    const phoneDisplay = profile.phone || '—'
    const hideAgencyAndLevel = analyticsScope.isSupervisor

    return (
        <Container>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                    <AdaptiveCard>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <Avatar
                                        size={56}
                                        shape="circle"
                                        src={profile.img || undefined}
                                        icon={<TbUser />}
                                        className="bg-primary/15 text-primary"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="truncate text-lg leading-tight">
                                            {profile.fullName || 'Профиль'}
                                        </h3>
                                        {profile.role ? (
                                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                                {profile.role}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    icon={<TbSettings />}
                                    className="shrink-0"
                                    onClick={() => navigate('/account/profile')}
                                >
                                    <span className="hidden sm:inline">
                                        Настройки
                                    </span>
                                </Button>
                            </div>

                            <div
                                className={classNames(
                                    'grid grid-cols-1 gap-2',
                                    !hideAgencyAndLevel && 'sm:grid-cols-3',
                                )}
                            >
                                <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-700/40">
                                    <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        <TbPhone className="text-sm" />
                                        Телефон
                                    </p>
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {phoneDisplay}
                                    </p>
                                </div>
                                {!hideAgencyAndLevel ? (
                                    <>
                                        <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-700/40">
                                            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                <TbBuilding className="text-sm" />
                                                Агентство
                                            </p>
                                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {profile.agency || '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-700/40">
                                            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                <TbBriefcase className="text-sm" />
                                                Уровень
                                                <Tooltip title="Подробнее об уровнях в разделе помощи">
                                                    <Link
                                                        to="/help"
                                                        className="inline-flex rounded-full text-gray-400 transition-colors hover:text-primary"
                                                        aria-label="Справка об уровнях"
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        <TbHelp className="text-sm" />
                                                    </Link>
                                                </Tooltip>
                                            </p>
                                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {profile.level || '—'}
                                            </p>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </AdaptiveCard>

                    <AdaptiveCard>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h4 className="mb-0.5 flex items-center gap-2">
                                        <TbBell className="shrink-0 text-lg text-primary" />
                                        <span className="truncate">
                                            Уведомления
                                        </span>
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Последние 3 уведомления
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="hidden shrink-0 sm:inline-flex"
                                    onClick={() =>
                                        navigate('/account/notifications')
                                    }
                                >
                                    Все уведомления
                                </Button>
                            </div>

                            {isNotificationsLoading ? (
                                <div className="flex min-h-36 items-center justify-center">
                                    <Spinner size={28} />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex min-h-36 flex-col items-center justify-center text-center">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Нет уведомлений
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Новые уведомления появятся здесь
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                    {notifications.map((log) => {
                                        const action = log.action
                                            ? resolveLogActionHref(
                                                  log.action.url,
                                              )
                                            : null
                                        const unread = !isUserLogRead(log)

                                        return (
                                            <li key={log.id}>
                                                <button
                                                    type="button"
                                                    className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                                                    onClick={() => {
                                                        if (action?.href) {
                                                            if (
                                                                action.external
                                                            ) {
                                                                window.open(
                                                                    action.href,
                                                                    '_blank',
                                                                    'noopener,noreferrer',
                                                                )
                                                                return
                                                            }
                                                            navigate(
                                                                action.href,
                                                            )
                                                            return
                                                        }
                                                        navigate(
                                                            '/account/notifications',
                                                        )
                                                    }}
                                                >
                                                    <UserLogAvatar
                                                        type={log.type}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-0.5 flex items-center justify-between gap-2">
                                                            <span className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                                {getUserLogTypeName(
                                                                    log,
                                                                )}
                                                            </span>
                                                            <span className="shrink-0 text-xs text-gray-400">
                                                                {formatUserLogTime(
                                                                    log.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <p
                                                            className={classNames(
                                                                'line-clamp-2 text-sm',
                                                                unread
                                                                    ? 'font-medium text-gray-900 dark:text-gray-100'
                                                                    : 'text-gray-600 dark:text-gray-300',
                                                            )}
                                                        >
                                                            {log.message}
                                                        </p>
                                                    </div>
                                                    {unread ? (
                                                        <span
                                                            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                                                            aria-hidden
                                                        />
                                                    ) : null}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}

                            <Button
                                size="sm"
                                block
                                className="sm:hidden"
                                onClick={() =>
                                    navigate('/account/notifications')
                                }
                            >
                                Все уведомления
                            </Button>
                        </div>
                    </AdaptiveCard>
                </div>

                <AdaptiveCard>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h3 className="mb-1">Статистика фиксаций</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Распределение по статусам и переходы между ними
                            </p>
                        </div>
                        <DashboardAnalyticsFilters
                            selectedAgencyId={selectedAgencyId}
                            selectedAgentId={selectedAgentId}
                            onAgencyChange={setSelectedAgencyId}
                            onAgentChange={setSelectedAgentId}
                        />
                    </div>
                </AdaptiveCard>

                {!canLoadAnalytics ? (
                    <AdaptiveCard>
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Выберите агента
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Аналитика доступна только по конкретному агенту
                            </p>
                        </div>
                    </AdaptiveCard>
                ) : (
                    <>
                        <AdaptiveCard>
                            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div className="min-w-0">
                                    <h4 className="mb-1">
                                        Распределение по статусам
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Нажмите на статус, чтобы открыть
                                        фиксации с этим фильтром
                                    </p>
                                </div>
                                <div className="w-full sm:w-80">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Период
                                    </label>
                                    <DatePicker.DatePickerRange
                                        value={statusesDateRange}
                                        locale="ru"
                                        inputFormat="DD.MM.YYYY"
                                        placeholder="Выберите период"
                                        separator="—"
                                        maxDate={new Date()}
                                        onChange={handleDateRangeChange(
                                            setStatusesDateRange,
                                        )}
                                    />
                                </div>
                            </div>
                            {isStatusesLoading && !statusCounts ? (
                                <div className="flex min-h-72 items-center justify-center">
                                    <Spinner size={36} />
                                </div>
                            ) : (
                                <div className="relative">
                                    {isStatusesValidating ? (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/40">
                                            <Spinner size={28} />
                                        </div>
                                    ) : null}
                                    <div
                                        className={classNames(
                                            'grid grid-cols-1 items-center gap-6 lg:grid-cols-2',
                                            isStatusesValidating &&
                                                'pointer-events-none opacity-60',
                                        )}
                                    >
                                        <div className="flex flex-col gap-2">
                                            {statusSummary.map((item) => (
                                                <button
                                                    key={item.status}
                                                    type="button"
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary/40 dark:hover:bg-primary/10"
                                                    onClick={() =>
                                                        navigate(
                                                            `/fixations?status=${item.status}`,
                                                        )
                                                    }
                                                >
                                                    <span className="flex min-w-0 items-center gap-2.5">
                                                        <span
                                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    item.color,
                                                            }}
                                                            aria-hidden
                                                        />
                                                        <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                                                            {item.label}
                                                        </span>
                                                    </span>
                                                    <span
                                                        className="shrink-0 text-sm font-semibold tabular-nums"
                                                        style={{
                                                            color: item.color,
                                                        }}
                                                    >
                                                        {item.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <div
                                            className={classNames(
                                                'mx-auto w-full',
                                                isDesktop
                                                    ? 'max-w-xl'
                                                    : 'max-w-md',
                                            )}
                                        >
                                            <Chart
                                                type="donut"
                                                series={donutSeries}
                                                height={isDesktop ? 420 : 300}
                                                customOptions={donutOptions}
                                                donutTitle="Всего"
                                                donutText={String(
                                                    totalFixations,
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </AdaptiveCard>

                        <AdaptiveCard>
                            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div className="min-w-0">
                                    <h4 className="mb-1">
                                        Переходы между статусами
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Динамика переходов фиксаций из одного
                                        статуса в другой по дням
                                    </p>
                                </div>
                                <div className="w-full sm:w-80">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Период
                                    </label>
                                    <DatePicker.DatePickerRange
                                        value={transitionsDateRange}
                                        locale="ru"
                                        inputFormat="DD.MM.YYYY"
                                        placeholder="Выберите период"
                                        separator="—"
                                        maxDate={new Date()}
                                        onChange={handleDateRangeChange(
                                            setTransitionsDateRange,
                                        )}
                                    />
                                </div>
                            </div>
                            {isTransitionsLoading && !transitionsData ? (
                                <div className="flex min-h-56 items-center justify-center">
                                    <Spinner size={32} />
                                </div>
                            ) : transitions.length === 0 ? (
                                <div className="relative flex min-h-56 flex-col items-center justify-center text-center">
                                    {isTransitionsValidating ? (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/40">
                                            <Spinner size={28} />
                                        </div>
                                    ) : null}
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Нет переходов за период
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Изменения статусов появятся здесь после
                                        событий в выбранном периоде
                                    </p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {isTransitionsValidating ? (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/40">
                                            <Spinner size={28} />
                                        </div>
                                    ) : null}
                                    <div
                                        className={classNames(
                                            isTransitionsValidating &&
                                                'pointer-events-none opacity-60',
                                        )}
                                    >
                                        <div className="overflow-x-auto">
                                            <div
                                                style={{
                                                    minWidth: `${transitionChartMinWidth}px`,
                                                }}
                                            >
                                                <Chart
                                                    type="line"
                                                    series={transitionSeries}
                                                    xAxis={
                                                        transitionCategories
                                                    }
                                                    height={360}
                                                    customOptions={
                                                        transitionOptions
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </AdaptiveCard>
                    </>
                )}
            </div>
        </Container>
    )
}

export default Home
