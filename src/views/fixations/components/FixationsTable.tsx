import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import DataTable from '@/components/shared/DataTable'
import {
    apiGetFixations,
    apiCreateFixationExtendRequest,
    apiApproveFixation,
    apiRejectFixation,
} from '@/services/FixationsService'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { TbCheck, TbX } from 'react-icons/tb'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { useSessionUser } from '@/store/authStore'
import { SUPERVISOR, AGENCY_SUPERVISOR } from '@/constants/roles.constant'
import { apiGetAgencies, apiGetAgency } from '@/services/AgencyService'
import type { AgencyAgent } from '@/@types/agency'
import { TbCalendarPlus, TbCalendarTime, TbEye } from 'react-icons/tb'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { Fixation, FixationStatus, GetFixationsResponse } from '../types'
import {
    fixationStatusMap,
    formatFixationDate,
    getFixationStatusDisplay,
    getFixationExpiryAccentClass,
} from '../utils'
import {
    getFixationColumnsScope,
    loadFixationColumnVisibility,
    saveFixationColumnVisibility,
    type FixationColumnId,
    type FixationColumnVisibility,
} from '../columnVisibility'
import FixationExtendRequestDialog, {
    type FixationExtendRequestValues,
} from './FixationExtendRequestDialog'
import FixationsTableTools from './FixationsTableTools'

type FixationsTableProps = {
    refreshKey?: number
    statusFilter?: FixationStatus
    onStatusFilterChange?: (status?: FixationStatus) => void
}

const FixationsTable = ({
    refreshKey = 0,
    statusFilter,
    onStatusFilterChange,
}: FixationsTableProps) => {
    const navigate = useNavigate()
    const user = useSessionUser((state) => state.user)
    const isSupervisor = (user.authority ?? []).includes(SUPERVISOR)
    const isAgencySupervisor = (user.authority ?? []).includes(AGENCY_SUPERVISOR)
    const canFilterAgents = isSupervisor || isAgencySupervisor

    const columnsScope = useMemo(
        () => getFixationColumnsScope(user.authority ?? []),
        [user.authority],
    )
    const [pageIndex, setPageIndex] = useState(1)
    const pageSize = 20
    const [search, setSearch] = useState('')
    const [agencyId, setAgencyId] = useState<number>()
    const [agentId, setAgentId] = useState<number>()
    const [agencyOptions, setAgencyOptions] = useState<{ value: number; label: string }[]>([])
    const [selectedAgencyOption, setSelectedAgencyOption] = useState<{ value: number; label: string } | null>(null)
    const [agencyPage, setAgencyPage] = useState(1)
    const [hasMoreAgencies, setHasMoreAgencies] = useState(true)
    const [isLoadingMoreAgencies, setIsLoadingMoreAgencies] = useState(false)
    const [debouncedAgencySearch, setDebouncedAgencySearch] = useState('')
    const [searchReloadKey, setSearchReloadKey] = useState(0)
    const agencySearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [agentOptions, setAgentOptions] = useState<{ value: number; label: string }[]>([])
    const effectiveAgencyId = isAgencySupervisor
        ? user.agency?.id
        : agencyId
    const [columnVisibility, setColumnVisibility] =
        useState<FixationColumnVisibility>(() => loadFixationColumnVisibility())
    const [extendFixation, setExtendFixation] = useState<Fixation | null>(null)
    const [isExtendOpen, setIsExtendOpen] = useState(false)
    const [isExtendSubmitting, setIsExtendSubmitting] = useState(false)
    const [actionFixation, setActionFixation] = useState<Fixation | null>(null)
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
    const [isActionSubmitting, setIsActionSubmitting] = useState(false)
    const [data, setData] = useState<GetFixationsResponse | undefined>(
        undefined,
    )
    const [isLoading, setIsLoading] = useState(true)
    const [refreshCount, setRefreshCount] = useState(0)

    useEffect(() => {
        if (!isSupervisor) return
        setAgencyPage(1)
        setHasMoreAgencies(true)
        void apiGetAgencies({ page: 1, per_page: 20, search: debouncedAgencySearch || undefined }).then((result) => {
            const list = result.data.map((agency) => ({ value: agency.id, label: agency.name }))
            setAgencyOptions((prev) => {
                const combined = selectedAgencyOption && !list.some((item) => item.value === selectedAgencyOption.value)
                    ? [selectedAgencyOption, ...list]
                    : list
                return combined
            })
            setHasMoreAgencies((result.meta?.last_page ?? 1) > 1)
        })
    }, [isSupervisor, debouncedAgencySearch, selectedAgencyOption, searchReloadKey])

    useEffect(() => {
        setAgentId(undefined)
        if (effectiveAgencyId == null) { setAgentOptions([]); return }
        void apiGetAgency(effectiveAgencyId, { with: 'agents' }).then((agency) => {
            setAgentOptions((agency?.agents ?? []).map((agent: AgencyAgent) => ({ value: agent.id, label: agent.name })))
        })
    }, [effectiveAgencyId])



    useEffect(() => {
        return () => {
            if (agencySearchTimerRef.current) {
                clearTimeout(agencySearchTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        setPageIndex(1)
    }, [statusFilter])

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)

        void apiGetFixations({
            page: pageIndex,
            page_size: pageSize,
            search: search || undefined,
            status: statusFilter,
            agency_id: effectiveAgencyId,
            agent_id: canFilterAgents ? agentId : undefined,
        })
            .then((response) => {
                if (!cancelled) setData(response)
            })
            .catch(() => {
                if (!cancelled) setData(undefined)
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [pageIndex, pageSize, refreshCount, refreshKey, search, statusFilter, agencyId, agentId])

    const list = data?.list ?? []
    const total = data?.total ?? 0

    useEffect(() => {
        saveFixationColumnVisibility(columnVisibility)
    }, [columnVisibility])

    const loadMoreAgencies = () => {
        if (!isSupervisor || isLoadingMoreAgencies || !hasMoreAgencies) return
        const nextPage = agencyPage + 1
        setIsLoadingMoreAgencies(true)
        void apiGetAgencies({ page: nextPage, per_page: 20, search: debouncedAgencySearch || undefined })
            .then((result) => {
                setAgencyOptions((current) => [
                    ...current,
                    ...result.data
                        .filter((agency) => !current.some((item) => item.value === agency.id))
                        .map((agency) => ({ value: agency.id, label: agency.name })),
                ])
                setAgencyPage(nextPage)
                setHasMoreAgencies((result.meta?.last_page ?? nextPage) > nextPage)
            })
            .finally(() => setIsLoadingMoreAgencies(false))
    }

    const handleSearchChange = (value: string) => {
        setSearch(value)
        setPageIndex(1)
    }

    const handleColumnVisibilityChange = (
        columnId: FixationColumnId,
        visible: boolean,
    ) => {
        setColumnVisibility((prev) => {
            const next = { ...prev, [columnId]: visible }
            const visibleCount = Object.values(next).filter(Boolean).length
            if (visibleCount === 0) return prev
            return next
        })
    }

    const handleConfirmAction = async () => {
        if (!actionFixation || !actionType) return
        setIsActionSubmitting(true)
        try {
            if (actionType === 'approve') {
                await apiApproveFixation(actionFixation.id)
                toast.push(
                    <Notification title="Успешно" type="success">
                        Фиксация #{actionFixation.id} одобрена
                    </Notification>,
                )
            } else {
                await apiRejectFixation(actionFixation.id)
                toast.push(
                    <Notification title="Успешно" type="success">
                        Фиксация #{actionFixation.id} отклонена
                    </Notification>,
                )
            }
            setActionFixation(null)
            setActionType(null)
            setRefreshCount((prev) => prev + 1)
        } catch (err: unknown) {
            toast.push(
                <Notification title="Ошибка" type="danger">
                    {getApiErrorMessage(
                        err,
                        actionType === 'approve'
                            ? 'Не удалось одобрить фиксацию'
                            : 'Не удалось отклонить фиксацию',
                    )}
                </Notification>,
            )
        } finally {
            setIsActionSubmitting(false)
        }
    }

    const handleOpenExtend = (fixation: Fixation) => {
        setExtendFixation(fixation)
        setIsExtendOpen(true)
    }

    const handleCloseExtend = () => {
        if (isExtendSubmitting) return
        setIsExtendOpen(false)
        setExtendFixation(null)
    }

    const handleSubmitExtend = async (values: FixationExtendRequestValues) => {
        if (!extendFixation) return

        setIsExtendSubmitting(true)
        try {
            await apiCreateFixationExtendRequest({
                fixation_id: Number(extendFixation.id) || extendFixation.id,
                add_days: values.extendDays,
                comment: values.comment,
            })
            toast.push(
                <Notification type="success">
                    Заявка на продление «{extendFixation.fullName}» на{' '}
                    {values.extendDays} дн. успешно создана
                </Notification>,
                { placement: 'top-center' },
            )
            setIsExtendOpen(false)
            setExtendFixation(null)
            setRefreshCount((prev) => prev + 1)
        } catch (err: unknown) {
            const msg = getApiErrorMessage(
                err,
                'Не удалось создать заявку на продление',
            )
            toast.push(<Notification type="danger">{msg}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsExtendSubmitting(false)
        }
    }

    const columns: ColumnDef<Fixation>[] = useMemo(() => {
        const allColumns: Array<ColumnDef<Fixation> & { id: string }> = [
            {
                id: 'fullName',
                header: 'ФИО',
                accessorKey: 'fullName',
                enableSorting: false,
                size: 320,
                minSize: 240,
                cell: (props) => (
                    <span className="font-semibold heading-text">
                        {props.row.original.fullName}
                    </span>
                ),
            },
            {
                id: 'phone',
                header: 'Номер',
                accessorKey: 'phone',
                enableSorting: false,
                size: 170,
                cell: (props) => (
                    <span className="whitespace-nowrap">
                        {props.row.original.phone}
                    </span>
                ),
            },
            {
                id: 'projectName',
                header: 'ЖК',
                accessorKey: 'projectName',
                enableSorting: false,
                size: 220,
                minSize: 180,
                cell: (props) => (
                    <span className="font-medium">
                        {props.row.original.projectName}
                    </span>
                ),
            },
            {
                id: 'agent',
                header: 'Агент',
                enableSorting: false,
                size: 200,
                minSize: 160,
                cell: (props) => {
                    const agent = props.row.original.agent
                    return (
                        <div className="min-w-0 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                {agent?.fullName || '—'}
                            </div>
                            {agent?.phone && agent.phone !== '—' ? (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {agent.phone}
                                </div>
                            ) : null}
                        </div>
                    )
                },
            },
            {
                id: 'agency',
                header: 'Агентство',
                enableSorting: false,
                size: 180,
                minSize: 140,
                cell: (props) => (
                    <span className="font-medium">
                        {props.row.original.agent?.agency || '—'}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Статус',
                accessorKey: 'status',
                enableSorting: false,
                size: 140,
                minSize: 120,
                maxSize: 160,
                cell: (props) => {
                    const status = getFixationStatusDisplay(
                        props.row.original,
                    )
                    return (
                        <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                            {status.label}
                        </span>
                    )
                },
            },
            {
                id: 'createdAt',
                header: 'Дата создания',
                accessorKey: 'createdAt',
                enableSorting: false,
                size: 130,
                minSize: 120,
                maxSize: 140,
                cell: (props) => (
                    <span className="whitespace-nowrap">
                        {formatFixationDate(props.row.original.createdAt)}
                    </span>
                ),
            },
            {
                id: 'expiresAt',
                header: 'Дата истечения',
                accessorKey: 'expiresAt',
                enableSorting: false,
                size: 130,
                minSize: 120,
                maxSize: 140,
                cell: (props) => (
                    <span
                        className={`whitespace-nowrap ${getFixationExpiryAccentClass(
                            props.row.original.expiresAt,
                        )}`}
                    >
                        {formatFixationDate(props.row.original.expiresAt)}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: 'Действия',
                enableSorting: false,
                size: 110,
                minSize: 100,
                maxSize: 120,
                cell: (props) => {
                    const fixation = props.row.original
                    const hasExtendRequest = Boolean(
                        fixation.has_extend_request ||
                            fixation.hasExtendRequest,
                    )
                    const canExtend =
                        fixation.status === 'fixed' && !hasExtendRequest
                    const rejectReason = fixation.extendRejectReason
                    const wasRejected = rejectReason != null
                    const rejectReasonText = rejectReason?.trim() || ''

                    const rejectedTooltip = (
                        <div className="max-w-[260px] space-y-1.5 text-left">
                            <div className="text-sm font-semibold text-rose-300">
                                Продление отклонено
                            </div>
                            {rejectReasonText ? (
                                <div className="rounded-md bg-rose-500/20 px-2 py-1.5 text-sm leading-snug text-white">
                                    <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-rose-200">
                                        Причина
                                    </span>
                                    {rejectReasonText}
                                </div>
                            ) : null}
                            {hasExtendRequest ? (
                                <div className="text-xs text-gray-300">
                                    Запрос на продление уже существует
                                </div>
                            ) : canExtend ? (
                                <div className="text-xs text-gray-300">
                                    Можно создать новую заявку
                                </div>
                            ) : (
                                <div className="text-xs text-gray-300">
                                    Продление недоступно
                                </div>
                            )}
                        </div>
                    )

                    return (
                        <div
                            className="flex items-center justify-center gap-1"
                            data-fixation-action="true"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <Tooltip title="Открыть страницу фиксации">
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<TbEye />}
                                    onClick={() =>
                                        navigate(`/fixations/${fixation.id}`)
                                    }
                                />
                            </Tooltip>
                            {hasExtendRequest ? (
                                <Tooltip
                                    title={
                                        wasRejected
                                            ? rejectedTooltip
                                            : 'Запрос на продление уже существует'
                                    }
                                >
                                    <span
                                        className={
                                            wasRejected
                                                ? 'inline-flex cursor-default items-center justify-center rounded-md bg-rose-50 p-1 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/40'
                                                : 'inline-flex cursor-default items-center justify-center p-1 text-amber-500 dark:text-amber-400'
                                        }
                                    >
                                        <TbCalendarTime className="text-lg" />
                                    </span>
                                </Tooltip>
                            ) : (
                                <Tooltip
                                    title={
                                        wasRejected
                                            ? rejectedTooltip
                                            : canExtend
                                              ? 'Создать заявку на продление'
                                              : 'Продление недоступно'
                                    }
                                >
                                    <span className="inline-flex">
                                        <Button
                                            size="xs"
                                            variant="plain"
                                            className={
                                                wasRejected
                                                    ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/40 dark:hover:bg-rose-500/25 dark:hover:text-rose-300'
                                                    : undefined
                                            }
                                            icon={<TbCalendarPlus />}
                                            disabled={!canExtend}
                                            onClick={() =>
                                                handleOpenExtend(fixation)
                                            }
                                        />
                                    </span>
                                </Tooltip>
                            )}
                            {isSupervisor &&
                            (fixation.status === 'moderation' ||
                                fixation.status === 'clinch') ? (
                                <>
                                    <Tooltip title="Одобрить фиксацию">
                                        <Button
                                            size="xs"
                                            variant="plain"
                                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/20"
                                            icon={<TbCheck className="text-base" />}
                                            onClick={() => {
                                                setActionFixation(fixation)
                                                setActionType('approve')
                                            }}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Отклонить фиксацию">
                                        <Button
                                            size="xs"
                                            variant="plain"
                                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/20"
                                            icon={<TbX className="text-base" />}
                                            onClick={() => {
                                                setActionFixation(fixation)
                                                setActionType('reject')
                                            }}
                                        />
                                    </Tooltip>
                                </>
                            ) : null}
                        </div>
                    )
                },
            },
        ]

        return allColumns.filter((column) => {
            if (column.id === 'actions') return true
            if (column.id === 'agent' && !columnsScope.canSeeAgent) return false
            if (column.id === 'agency' && !columnsScope.canSeeAgency)
                return false
            return columnVisibility[column.id as FixationColumnId]
        })
    }, [columnVisibility, columnsScope.canSeeAgency, columnsScope.canSeeAgent])

    const pageData = list

    return (
        <div className="flex flex-col gap-4">
            <FixationsTableTools
                columnVisibility={columnVisibility}
                columnOptionsAuthority={user.authority ?? []}
                statusFilter={statusFilter}
                showAgencyFilter={isSupervisor}
                showAgentFilter={canFilterAgents}
                agencyOptions={agencyOptions}
                agentOptions={agentOptions}
                agencyId={agencyId}
                agentId={agentId}
                onAgencyChange={(option) => {
                    setSelectedAgencyOption(option ?? null)
                    setAgencyId(option?.value)
                    setPageIndex(1)
                }}
                onAgentChange={(value) => {
                    setAgentId(value)
                    setPageIndex(1)
                }}
                onAgencySearchChange={(value) => {
                    const trimmed = value.trim()
                    setAgencyPage(1)
                    if (agencySearchTimerRef.current) {
                        clearTimeout(agencySearchTimerRef.current)
                        agencySearchTimerRef.current = null
                    }
                    if (!trimmed) {
                        setDebouncedAgencySearch('')
                        setSearchReloadKey((prev) => prev + 1)
                        return
                    }
                    agencySearchTimerRef.current = setTimeout(() => {
                        agencySearchTimerRef.current = null
                        setDebouncedAgencySearch(trimmed)
                    }, 400)
                }}
                onAgencyMenuScrollToBottom={loadMoreAgencies}
                isLoadingMoreAgencies={isLoadingMoreAgencies}
                onSearchChange={handleSearchChange}
                onStatusFilterChange={(status) =>
                    onStatusFilterChange?.(status)
                }
                onColumnVisibilityChange={handleColumnVisibilityChange}
            />
            <DataTable
                columns={columns}
                data={pageData}
                loading={isLoading}
                noData={!isLoading && pageData.length === 0}
                pagingData={{
                    total,
                    pageIndex,
                    pageSize,
                }}
                onPaginationChange={setPageIndex}
                onRowClick={(row) => navigate(`/fixations/${row.id}`)}
            />
            <FixationExtendRequestDialog
                isOpen={isExtendOpen}
                fixation={extendFixation}
                isSubmitting={isExtendSubmitting}
                onClose={handleCloseExtend}
                onSubmit={handleSubmitExtend}
            />
            <ConfirmDialog
                isOpen={Boolean(actionType && actionFixation)}
                type={actionType === 'approve' ? 'info' : 'danger'}
                title={actionType === 'approve' ? 'Одобрить фиксацию' : 'Отклонить фиксацию'}
                confirmButtonColor={actionType === 'approve' ? 'emerald-600' : 'red-600'}
                confirmText={actionType === 'approve' ? 'Одобрить' : 'Отклонить'}
                cancelText="Отмена"
                isLoading={isActionSubmitting}
                onClose={() => !isActionSubmitting && (setActionFixation(null), setActionType(null))}
                onCancel={() => !isActionSubmitting && (setActionFixation(null), setActionType(null))}
                onConfirm={handleConfirmAction}
            >
                <p>
                    {actionType === 'approve'
                        ? `Вы уверены, что хотите одобрить фиксацию #${actionFixation?.id}?`
                        : `Вы уверены, что хотите отклонить фиксацию #${actionFixation?.id}?`}
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default FixationsTable
