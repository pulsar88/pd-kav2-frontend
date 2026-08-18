import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Chart from '@/components/shared/Chart'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import {
    FIXATION_STATUS_COLORS,
    FIXATION_STATUS_ORDER,
} from '@/views/fixations/dashboard.constants'
import { defaultFixationsDashboardMonth } from '@/views/fixations/fixationsDashboardMockData'
import { apiGetFixationsDashboardStats } from '@/services/FixationsService'
import { fixationStatusMap } from '@/views/fixations/utils'
import type { FixationStatus } from '@/views/fixations/types'
import type { ApexOptions } from 'apexcharts'

const Home = () => {
    const [selectedMonth, setSelectedMonth] = useState(
        defaultFixationsDashboardMonth,
    )

    const { data, isLoading } = useSWR(
        ['fixations-dashboard', selectedMonth],
        () => apiGetFixationsDashboardStats(selectedMonth),
    )

    const monthOptions = useMemo(
        () =>
            (data?.availableMonths ?? []).map((item) => ({
                value: item.value,
                label: item.label,
            })),
        [data?.availableMonths],
    )

    const selectedMonthOption = useMemo(
        () =>
            monthOptions.find((item) => item.value === selectedMonth) ?? null,
        [monthOptions, selectedMonth],
    )

    const statusLabels = useMemo(
        () =>
            FIXATION_STATUS_ORDER.map(
                (status) => fixationStatusMap[status].label,
            ),
        [],
    )

    const statusColors = useMemo(
        () => FIXATION_STATUS_ORDER.map((status) => FIXATION_STATUS_COLORS[status]),
        [],
    )

    const donutSeries = useMemo(() => {
        if (!data) return []

        return FIXATION_STATUS_ORDER.map((status) => data.statusCounts[status])
    }, [data])

    const totalFixations = useMemo(
        () => donutSeries.reduce((sum, value) => sum + value, 0),
        [donutSeries],
    )

    const timelineSeries = useMemo(() => {
        if (!data) return []

        return [
            {
                name: 'Всего фиксаций',
                data: data.timeline.map((point) =>
                    FIXATION_STATUS_ORDER.reduce(
                        (sum, status) => sum + point.counts[status],
                        0,
                    ),
                ),
            },
        ]
    }, [data])

    const timelineCategories = useMemo(() => {
        if (!data) return []

        return data.timeline.map((point) => {
            const day = point.date.split('-')[2]
            return String(Number(day))
        })
    }, [data])

    const donutOptions = useMemo<ApexOptions>(
        () => ({
            labels: statusLabels,
            colors: statusColors,
            legend: {
                show: true,
                position: 'bottom',
                horizontalAlign: 'center',
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
        }),
        [statusColors, statusLabels],
    )

    const timelineOptions = useMemo<ApexOptions>(
        () => ({
            colors: ['#2a85ff'],
            chart: {
                toolbar: {
                    show: false,
                },
            },
            stroke: {
                curve: 'smooth',
                width: 2.5,
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.35,
                    opacityTo: 0.05,
                    stops: [0, 90, 100],
                },
            },
            legend: {
                show: false,
            },
            xaxis: {
                title: {
                    text: 'День месяца',
                },
                labels: {
                    rotate: 0,
                },
            },
            yaxis: {
                title: {
                    text: 'Количество фиксаций',
                },
                min: 0,
                forceNiceScale: true,
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} шт.`,
                },
            },
        }),
        [],
    )

    const statusSummary = useMemo(() => {
        if (!data) return []

        return FIXATION_STATUS_ORDER.map((status: FixationStatus) => ({
            status,
            label: fixationStatusMap[status].label,
            count: data.statusCounts[status],
            color: FIXATION_STATUS_COLORS[status],
        }))
    }, [data])

    return (
        <Container>
            <div className="flex flex-col gap-4">
                <AdaptiveCard>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h3 className="mb-1">Дашборд</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Статистика по фиксациям за выбранный месяц
                            </p>
                        </div>
                        <div className="w-full sm:w-56">
                            <label className="mb-1.5 block text-sm font-medium">
                                Месяц
                            </label>
                            <Select
                                isSearchable={false}
                                options={monthOptions}
                                value={selectedMonthOption}
                                placeholder="Выберите месяц"
                                onChange={(option) => {
                                    if (option?.value) {
                                        setSelectedMonth(String(option.value))
                                    }
                                }}
                            />
                        </div>
                    </div>
                </AdaptiveCard>

                {isLoading && !data ? (
                    <AdaptiveCard>
                        <div className="flex min-h-72 items-center justify-center">
                            <Spinner size={36} />
                        </div>
                    </AdaptiveCard>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {statusSummary.map((item) => (
                                <AdaptiveCard key={item.status}>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.label}
                                        </span>
                                        <span
                                            className="text-2xl font-semibold"
                                            style={{ color: item.color }}
                                        >
                                            {item.count}
                                        </span>
                                    </div>
                                </AdaptiveCard>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <AdaptiveCard className="xl:col-span-1">
                                <div className="mb-4">
                                    <h4 className="mb-1">
                                        Распределение по статусам
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Сколько фиксаций в каждом статусе на
                                        конец месяца
                                    </p>
                                </div>
                                <Chart
                                    type="donut"
                                    series={donutSeries}
                                    height={340}
                                    customOptions={donutOptions}
                                    donutTitle="Всего"
                                    donutText={String(totalFixations)}
                                />
                            </AdaptiveCard>

                            <AdaptiveCard className="xl:col-span-2">
                                <div className="mb-4">
                                    <h4 className="mb-1">Динамика фиксаций</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Общее количество фиксаций по дням месяца
                                    </p>
                                </div>
                                <Chart
                                    type="area"
                                    series={timelineSeries}
                                    xAxis={timelineCategories}
                                    height={340}
                                    customOptions={timelineOptions}
                                />
                            </AdaptiveCard>
                        </div>
                    </>
                )}
            </div>
        </Container>
    )
}

export default Home
