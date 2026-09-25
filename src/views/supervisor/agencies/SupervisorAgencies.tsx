import { useCallback, useEffect, useMemo, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import DataTable from '@/components/shared/DataTable'
import DebouceInput from '@/components/shared/DebouceInput'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import type { ColumnDef } from '@/components/shared/DataTable'
import {
    apiGetAgencies,
    apiToggleAgencyActivate,
    apiSyncAgencies,
} from '@/services/AgencyService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import type { AgencyItem } from '@/@types/agency'
import { formatRuPhone } from '@/views/fixations/utils'
import { useNavigate } from 'react-router'
import {
    TbBuilding,
    TbCircleCheck,
    TbCircleX,
    TbPower,
    TbRefresh,
    TbSearch,
    TbUser,
} from 'react-icons/tb'
import type { ChangeEvent } from 'react'
import { Tooltip } from '@/components/ui'

const PAGE_SIZE = 20

const isAgencyActive = (agency: AgencyItem): boolean =>
    Boolean(agency.active === 1 || agency.active === true)

const SupervisorAgencies = () => {
    const navigate = useNavigate()
    const [agencies, setAgencies] = useState<AgencyItem[]>([])
    const [total, setTotal] = useState(0)
    const [pageIndex, setPageIndex] = useState(1)
    const [search, setSearch] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    const [activeTarget, setActiveTarget] = useState<AgencyItem | null>(null)
    const [isTogglingActive, setIsTogglingActive] = useState(false)

    const [isSyncing, setIsSyncing] = useState(false)
    const [syncCooldownLeft, setSyncCooldownLeft] = useState(0)

    const loadAgencies = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await apiGetAgencies({
                page: pageIndex,
                per_page: PAGE_SIZE,
                search: search || undefined,
                with: 'supervisor',
            })
            setAgencies(response.data)
            setTotal(response.meta?.total ?? response.data.length)
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось загрузить список агентств',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
            setAgencies([])
            setTotal(0)
        } finally {
            setIsLoading(false)
        }
    }, [pageIndex, search])

    useEffect(() => {
        void loadAgencies()
    }, [loadAgencies])

    // Таймер кулдауна синхронизации
    useEffect(() => {
        if (syncCooldownLeft <= 0) return
        const timer = setInterval(() => {
            setSyncCooldownLeft((prev) => Math.max(0, prev - 1))
        }, 1000)
        return () => clearInterval(timer)
    }, [syncCooldownLeft])

    const handleSearchChange = (value: string) => {
        setPageIndex(1)
        setSearch(value.trim())
    }

    const handleSync = async () => {
        if (isSyncing || syncCooldownLeft > 0) return

        setIsSyncing(true)
        try {
            await apiSyncAgencies()
            toast.push(
                <Notification type="info">
                    Синхронизация запущена в фоновом режиме. Список агентств
                    обновится автоматически через некоторое время.
                </Notification>,
                { placement: 'top-center' },
            )
            setSyncCooldownLeft(30)
            void loadAgencies()
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось запустить синхронизацию агентств',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSyncing(false)
        }
    }

    const handleConfirmToggleActive = async () => {
        if (!activeTarget) return

        const active = isAgencyActive(activeTarget)
        setIsTogglingActive(true)
        try {
            await apiToggleAgencyActivate(activeTarget.id)
            toast.push(
                <Notification type={active ? 'warning' : 'success'}>
                    Агентство «{activeTarget.name}»{' '}
                    {active ? 'деактивировано' : 'активировано'}
                </Notification>,
                { placement: 'top-center' },
            )
            setActiveTarget(null)
            void loadAgencies()
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        active
                            ? 'Не удалось деактивировать агентство'
                            : 'Не удалось активировать агентство',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsTogglingActive(false)
        }
    }

    const columns: ColumnDef<AgencyItem>[] = useMemo(
        () => [
            {
                header: 'Название агентства',
                accessorKey: 'name',
                enableSorting: false,
                cell: ({ row }) => {
                    const agency = row.original
                    return (
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                                <TbBuilding />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                    {agency.name || '—'}
                                </p>
                                {agency.is_aggregator ? (
                                    <Tag className="mt-0.5 border-0 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 leading-none">
                                        Агрегатор
                                    </Tag>
                                ) : null}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Руководитель',
                id: 'supervisor',
                enableSorting: false,
                cell: ({ row }) => {
                    const supervisor = row.original.supervisor
                    if (!supervisor) {
                        return <span className="text-sm text-gray-400">—</span>
                    }

                    return (
                        <div className="flex min-w-0 items-center gap-2">
                            <TbUser className="shrink-0 text-gray-400 text-base" />
                            <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {supervisor.name || '—'}
                                </p>
                                {supervisor.phone ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                                        {formatRuPhone(supervisor.phone)}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Срок фиксации',
                accessorKey: 'fix_days',
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
                        {row.original.fix_days ? `${row.original.fix_days} дн.` : '—'}
                    </span>
                ),
            },
            {
                header: 'Статус',
                id: 'status',
                enableSorting: false,
                cell: ({ row }) => {
                    const active = isAgencyActive(row.original)
                    return (
                        <Tag
                            className={`border-0 font-medium ${
                                active
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                            }`}
                        >
                            <span className="flex items-center gap-1">
                                {active ? (
                                    <TbCircleCheck className="text-sm" />
                                ) : (
                                    <TbCircleX className="text-sm" />
                                )}
                                {active ? 'Активно' : 'Неактивно'}
                            </span>
                        </Tag>
                    )
                },
            },
            {
                header: 'Действия',
                id: 'actions',
                enableSorting: false,
                cell: ({ row }) => {
                    const agency = row.original
                    const active = isAgencyActive(agency)
                    return (
                        <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Tooltip
                                title={
                                    active
                                        ? 'Деактивировать агентство'
                                        : 'Активировать агентство'
                                }
                            >
                                <Button
                                    size="xs"
                                    variant="solid"
                                    shape="circle"
                                    className={
                                        active
                                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }
                                    icon={<TbPower />}
                                    aria-label={
                                        active
                                            ? 'Деактивировать'
                                            : 'Активировать'
                                    }
                                    onClick={() => setActiveTarget(agency)}
                                />
                            </Tooltip>
                        </div>
                    )
                },
            },
        ],
        [],
    )

    const isActiveTargetActive = Boolean(
        activeTarget && isAgencyActive(activeTarget),
    )

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="mb-1 flex items-center gap-2">
                                <TbBuilding className="shrink-0 text-primary" />
                                Агентства
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Управление агентствами недвижимости и их активностью
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<TbRefresh className={isSyncing ? 'animate-spin' : ''} />}
                            loading={isSyncing}
                            disabled={isSyncing || syncCooldownLeft > 0}
                            onClick={handleSync}
                        >
                            {syncCooldownLeft > 0
                                ? `Синхронизация (${syncCooldownLeft}с)`
                                : 'Синхронизировать'}
                        </Button>
                    </div>

                    <div className="max-w-md">
                        <DebouceInput
                            wait={900}
                            placeholder="Поиск агентства по названию..."
                            suffix={<TbSearch className="text-lg" />}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSearchChange(e.target.value)
                            }
                        />
                    </div>

                    <DataTable
                        columns={columns}
                        data={agencies}
                        loading={isLoading}
                        noData={!isLoading && agencies.length === 0}
                        pagingData={{
                            total,
                            pageIndex,
                            pageSize: PAGE_SIZE,
                        }}
                        onPaginationChange={setPageIndex}
                        onRowClick={(row) => navigate(`/supervisor/agencies/${row.id}`)}
                    />
                </div>
            </AdaptiveCard>

            <ConfirmDialog
                isOpen={Boolean(activeTarget)}
                type={isActiveTargetActive ? 'danger' : 'info'}
                title={
                    isActiveTargetActive
                        ? 'Деактивировать агентство?'
                        : 'Активировать агентство?'
                }
                confirmText={
                    isActiveTargetActive ? 'Деактивировать' : 'Активировать'
                }
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: isTogglingActive,
                    disabled: isTogglingActive,
                    className: isActiveTargetActive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white',
                }}
                onCancel={() => {
                    if (!isTogglingActive) setActiveTarget(null)
                }}
                onClose={() => {
                    if (!isTogglingActive) setActiveTarget(null)
                }}
                onConfirm={() => {
                    void handleConfirmToggleActive()
                }}
            >
                <p>
                    {isActiveTargetActive
                        ? `Вы уверены, что хотите деактивировать агентство «${activeTarget?.name}»? Агенты агентства временно не смогут создавать новые фиксации.`
                        : `Активировать агентство «${activeTarget?.name}»? Агентам снова будет доступна работа с объектами и фиксациями.`}
                </p>
            </ConfirmDialog>
        </Container>
    )
}

export default SupervisorAgencies
