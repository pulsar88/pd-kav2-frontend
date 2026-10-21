import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import Select from '@/components/ui/Select'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import DataTable from '@/components/shared/DataTable'
import DebouceInput from '@/components/shared/DebouceInput'
import { apiGetFixations, apiRestoreFixation } from '@/services/FixationsService'
import { apiGetAgencies, apiGetAgency } from '@/services/AgencyService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import type { AgencyAgent } from '@/@types/agency'
import type { ColumnDef } from '@/components/shared/DataTable'
import type {
    Fixation,
    FixationStatus,
    GetFixationsResponse,
} from '@/views/fixations/types'
import { FIXATION_STATUS_ORDER } from '@/views/fixations/dashboard.constants'
import {
    formatFixationDate,
    fixationStatusMap,
    getFixationStatusDisplay,
    getFixationExpiryAccentClass,
} from '@/views/fixations/utils'
import {
    TbRotateClockwise,
    TbRefresh,
    TbBuilding,
    TbUser,
    TbColumns,
    TbSearch,
} from 'react-icons/tb'
import FixationRestoreDialog, {
    type FixationRestoreValues,
} from './FixationRestoreDialog'

export type RestoreColumnId =
    | 'client'
    | 'object'
    | 'agent'
    | 'status'
    | 'createdAt'
    | 'expiresAt'

export type RestoreColumnVisibility = Record<RestoreColumnId, boolean>

type FilterOption = { value: number; label: string }

type StatusOption = {
    value: FixationStatus
    label: string
}

const STATUS_OPTIONS: StatusOption[] = FIXATION_STATUS_ORDER.map((status) => ({
    value: status,
    label: fixationStatusMap[status].label,
}))

export const RESTORE_COLUMN_OPTIONS: Array<{
    id: RestoreColumnId
    label: string
}> = [
    { id: 'client', label: 'Клиент' },
    { id: 'object', label: 'Объект' },
    { id: 'agent', label: 'Агент' },
    { id: 'status', label: 'Статус' },
    { id: 'createdAt', label: 'Дата создания' },
    { id: 'expiresAt', label: 'Дата истечения' },
]

export const DEFAULT_RESTORE_COLUMN_VISIBILITY: RestoreColumnVisibility = {
    client: true,
    object: true,
    agent: true,
    status: true,
    createdAt: true,
    expiresAt: true,
}

const STORAGE_KEY = 'agent-cabinet:supervisor-restore-column-visibility'

const loadColumnVisibility = (): RestoreColumnVisibility => {
    if (typeof window === 'undefined') {
        return DEFAULT_RESTORE_COLUMN_VISIBILITY
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_RESTORE_COLUMN_VISIBILITY
        const parsed = JSON.parse(raw) as Partial<RestoreColumnVisibility>
        return {
            ...DEFAULT_RESTORE_COLUMN_VISIBILITY,
            ...parsed,
        }
    } catch {
        return DEFAULT_RESTORE_COLUMN_VISIBILITY
    }
}

const saveColumnVisibility = (visibility: RestoreColumnVisibility) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
}

const RestoreFixationsTab = () => {
    const [pageIndex, setPageIndex] = useState(1)
    const pageSize = 20
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<FixationStatus | undefined>(
        'expired',
    )
    const [agencyId, setAgencyId] = useState<number | undefined>()
    const [agentId, setAgentId] = useState<number | undefined>()
    const [agencyOptions, setAgencyOptions] = useState<FilterOption[]>([])
    const [selectedAgencyOption, setSelectedAgencyOption] =
        useState<FilterOption | null>(null)
    const [agencyPage, setAgencyPage] = useState(1)
    const [hasMoreAgencies, setHasMoreAgencies] = useState(true)
    const [isLoadingMoreAgencies, setIsLoadingMoreAgencies] = useState(false)
    const [debouncedAgencySearch, setDebouncedAgencySearch] = useState('')
    const [searchReloadKey, setSearchReloadKey] = useState(0)
    const agencySearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    )
    const [agentOptions, setAgentOptions] = useState<FilterOption[]>([])
    const [columnVisibility, setColumnVisibility] =
        useState<RestoreColumnVisibility>(() => loadColumnVisibility())
    const [data, setData] = useState<GetFixationsResponse | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)
    const [restoreFixation, setRestoreFixation] = useState<Fixation | null>(null)
    const [isRestoreOpen, setIsRestoreOpen] = useState(false)
    const [isRestoring, setIsRestoring] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        saveColumnVisibility(columnVisibility)
    }, [columnVisibility])

    useEffect(() => {
        return () => {
            if (agencySearchTimerRef.current) {
                clearTimeout(agencySearchTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (agencyId != null && !selectedAgencyOption) {
            void apiGetAgency(agencyId).then((agency) => {
                if (agency) {
                    const opt = { value: agency.id, label: agency.name }
                    setSelectedAgencyOption(opt)
                    setAgencyOptions((prev) =>
                        prev.some((item) => item.value === opt.value)
                            ? prev
                            : [opt, ...prev],
                    )
                }
            })
        }
    }, [agencyId, selectedAgencyOption])

    useEffect(() => {
        setAgencyPage(1)
        setHasMoreAgencies(true)
        void apiGetAgencies({
            page: 1,
            per_page: 20,
            search: debouncedAgencySearch || undefined,
        }).then((result) => {
            const list = result.data.map((agency) => ({
                value: agency.id,
                label: agency.name,
            }))
            setAgencyOptions(() => {
                const combined =
                    selectedAgencyOption &&
                    !list.some(
                        (item) => item.value === selectedAgencyOption.value,
                    )
                        ? [selectedAgencyOption, ...list]
                        : list
                return combined
            })
            setHasMoreAgencies((result.meta?.last_page ?? 1) > 1)
        })
    }, [debouncedAgencySearch, selectedAgencyOption, searchReloadKey])

    useEffect(() => {
        if (agencyId == null) {
            setAgentOptions([])
            setAgentId(undefined)
            return
        }

        void apiGetAgency(agencyId, { with: 'agents' }).then((agency) => {
            const agents = agency?.agents ?? []
            setAgentOptions(
                agents.map((agent: AgencyAgent) => ({
                    value: Number(agent.id),
                    label: agent.name,
                })),
            )
        })
    }, [agencyId])

    const handleColumnVisibilityChange = (
        columnId: RestoreColumnId,
        visible: boolean,
    ) => {
        setColumnVisibility((prev) => {
            const next = { ...prev, [columnId]: visible }
            const visibleCount = Object.values(next).filter(Boolean).length
            if (visibleCount === 0) return prev
            return next
        })
    }

    const visibleColumnsCount = Object.values(columnVisibility).filter(
        Boolean,
    ).length

    const loadMoreAgencies = () => {
        if (isLoadingMoreAgencies || !hasMoreAgencies) return
        const nextPage = agencyPage + 1
        setIsLoadingMoreAgencies(true)
        void apiGetAgencies({
            page: nextPage,
            per_page: 20,
            search: debouncedAgencySearch || undefined,
        })
            .then((result) => {
                setAgencyOptions((current) => [
                    ...current,
                    ...result.data
                        .filter(
                            (agency) =>
                                !current.some(
                                    (item) => item.value === agency.id,
                                ),
                        )
                        .map((agency) => ({
                            value: agency.id,
                            label: agency.name,
                        })),
                ])
                setAgencyPage(nextPage)
                setHasMoreAgencies(
                    (result.meta?.last_page ?? nextPage) > nextPage,
                )
            })
            .finally(() => setIsLoadingMoreAgencies(false))
    }

    const handleSearchChange = (value: string) => {
        setSearch(value)
        setPageIndex(1)
    }

    const handleAgencySearchChange = (value: string) => {
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
    }

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)

        void apiGetFixations({
            page: pageIndex,
            page_size: pageSize,
            search: search || undefined,
            status: statusFilter,
            agency_id: agencyId,
            agent_id: agentId,
        })
            .then((response) => {
                if (!cancelled) setData(response)
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setData(undefined)
                    const msg =
                        err instanceof Error
                            ? err.message
                            : 'Не удалось загрузить истекшие фиксации'
                    toast.push(
                        <Notification type="danger">{msg}</Notification>,
                        { placement: 'top-center' },
                    )
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [
        pageIndex,
        pageSize,
        refreshKey,
        search,
        statusFilter,
        agencyId,
        agentId,
    ])

    const list = data?.list ?? []
    const total = data?.total ?? 0

    const selectedStatus =
        STATUS_OPTIONS.find((item) => item.value === statusFilter) ?? null

    const handleOpenRestore = (fixation: Fixation) => {
        setRestoreFixation(fixation)
        setIsRestoreOpen(true)
    }

    const handleCloseRestore = () => {
        if (isRestoring) return
        setIsRestoreOpen(false)
        setRestoreFixation(null)
    }

    const handleSubmitRestore = async (values: FixationRestoreValues) => {
        if (!restoreFixation) return

        setIsRestoring(true)
        try {
            await apiRestoreFixation(restoreFixation.id, {
                amocrm_status_id: values.amocrm_status_id,
                fixed_till: values.fixed_till,
            })
            toast.push(
                <Notification type="success">
                    Фиксация «{restoreFixation.fullName}» успешно восстановлена
                </Notification>,
                { placement: 'top-center' },
            )
            setIsRestoreOpen(false)
            setRestoreFixation(null)
            setRefreshKey((prev) => prev + 1)
        } catch (err: unknown) {
            const msg = getApiErrorMessage(
                err,
                'Не удалось восстановить фиксацию',
            )
            toast.push(<Notification type="danger">{msg}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsRestoring(false)
        }
    }

    const columns: ColumnDef<Fixation>[] = useMemo(() => {
        const allColumns: Array<ColumnDef<Fixation> & { id: string }> = [
            {
                id: 'client',
                header: 'Клиент',
                size: 240,
                minSize: 220,
                cell: (props) => (
                    <div className="flex items-start gap-2.5 whitespace-nowrap">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                            <TbUser className="text-base" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                {props.row.original.fullName || '—'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {props.row.original.phone || '—'}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                id: 'object',
                header: 'Объект',
                size: 220,
                minSize: 180,
                maxSize: 260,
                cell: (props) => {
                    const title =
                        (props.row.original.projectName ||
                            props.row.original.objectName ||
                            '—') +
                        (props.row.original.apartment
                            ? `, кв. ${props.row.original.apartment}`
                            : '')
                    const address = props.row.original.address

                    return (
                        <div className="flex max-w-[220px] items-start gap-2.5">
                            <div className="mt-0.5 shrink-0 rounded-lg bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <TbBuilding className="text-base" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {title}
                                </div>
                                {address ? (
                                    <div className="break-words text-xs leading-snug text-gray-400">
                                        {address}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )
                },
            },
            {
                id: 'agent',
                header: 'Агент',
                size: 220,
                minSize: 180,
                cell: (props) => {
                    const agent = props.row.original.agent
                    return (
                        <div className="min-w-0 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                {agent?.fullName || '—'}
                            </div>
                            {agent?.phone && (
                                <div className="text-xs text-gray-400 whitespace-nowrap">
                                    {agent.phone}
                                </div>
                            )}
                            {agent?.agency && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {agent.agency}
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                id: 'status',
                header: 'Статус',
                size: 140,
                minSize: 130,
                cell: (props) => {
                    const status = getFixationStatusDisplay(props.row.original)
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
                size: 120,
                minSize: 110,
                cell: (props) => (
                    <span className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {formatFixationDate(props.row.original.createdAt)}
                    </span>
                ),
            },
            {
                id: 'expiresAt',
                header: 'Истекает',
                size: 120,
                minSize: 110,
                cell: (props) => (
                    <span
                        className={`whitespace-nowrap text-xs ${getFixationExpiryAccentClass(
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
                size: 90,
                minSize: 80,
                maxSize: 100,
                cell: (props) => {
                    const fixation = props.row.original
                    return (
                        <div
                            className="flex items-center justify-center gap-1 whitespace-nowrap"
                            data-fixation-action="true"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Tooltip title="Восстановить фиксацию">
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={
                                        <TbRotateClockwise className="text-base" />
                                    }
                                    onClick={() =>
                                        handleOpenRestore(fixation)
                                    }
                                />
                            </Tooltip>
                        </div>
                    )
                },
            },
        ]

        return allColumns.filter((column) => {
            if (column.id === 'actions') return true
            return columnVisibility[column.id as RestoreColumnId]
        })
    }, [columnVisibility])

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
                <div className="min-w-[260px] flex-1">
                    <DebouceInput
                        placeholder="Поиск по фиксациям..."
                        suffix={<TbSearch className="text-lg" />}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleSearchChange(e.target.value)
                        }
                    />
                </div>
                <div className="w-full shrink-0 lg:w-[19.5rem]">
                    <Select<FilterOption, false>
                        isClearable
                        isSearchable
                        placeholder="Все агентства"
                        options={agencyOptions}
                        value={
                            agencyOptions.find(
                                (item) => item.value === agencyId,
                            ) ?? null
                        }
                        filterOption={() => true}
                        isLoading={isLoadingMoreAgencies}
                        onChange={(option) => {
                            setSelectedAgencyOption(option ?? null)
                            setAgencyId(option?.value)
                            setAgentId(undefined)
                            setPageIndex(1)
                        }}
                        onInputChange={(value, actionMeta) => {
                            if (actionMeta.action === 'input-change') {
                                handleAgencySearchChange(value)
                            } else if (
                                actionMeta.action === 'menu-close' ||
                                actionMeta.action === 'input-blur'
                            ) {
                                handleAgencySearchChange('')
                            }
                            return value
                        }}
                        onMenuScrollToBottom={loadMoreAgencies}
                    />
                </div>
                <div className="w-full shrink-0 lg:w-[19.5rem]">
                    <Select<FilterOption, false>
                        isClearable
                        isSearchable
                        placeholder="Все агенты"
                        options={agentOptions}
                        value={
                            agentOptions.find(
                                (item) => item.value === agentId,
                            ) ?? null
                        }
                        isDisabled={!agencyId}
                        onChange={(option) => {
                            setAgentId(option?.value)
                            setPageIndex(1)
                        }}
                    />
                </div>
                <div className="w-full shrink-0 lg:w-56">
                    <Select<StatusOption, false>
                        isClearable
                        isSearchable={false}
                        placeholder="Все статусы"
                        options={STATUS_OPTIONS}
                        value={selectedStatus}
                        onChange={(option) => {
                            setStatusFilter(option?.value)
                            setPageIndex(1)
                        }}
                    />
                </div>
                <div className="flex shrink-0 gap-2 lg:ml-auto">
                    <Dropdown
                        placement="bottom-end"
                        renderTitle={
                            <Button
                                type="button"
                                icon={<TbColumns />}
                                className="shrink-0"
                            >
                                Столбцы
                            </Button>
                        }
                    >
                        <Dropdown.Item variant="header">
                            <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Отображаемые столбцы
                            </div>
                        </Dropdown.Item>
                        {RESTORE_COLUMN_OPTIONS.map((column) => {
                            const checked = columnVisibility[column.id]
                            const disableUncheck =
                                checked && visibleColumnsCount <= 1

                            return (
                                <Dropdown.Item
                                    key={column.id}
                                    variant="custom"
                                    onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                    }}
                                >
                                    <label
                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        <Checkbox
                                            checked={checked}
                                            disabled={disableUncheck}
                                            onChange={(value) =>
                                                handleColumnVisibilityChange(
                                                    column.id,
                                                    value,
                                                )
                                            }
                                        />
                                        <span className="text-sm">
                                            {column.label}
                                        </span>
                                    </label>
                                </Dropdown.Item>
                            )
                        })}
                    </Dropdown>

                    <Button
                        type="button"
                        variant="default"
                        icon={<TbRefresh />}
                        loading={isLoading}
                        onClick={() => setRefreshKey((prev) => prev + 1)}
                    >
                        Обновить
                    </Button>
                </div>
            </div>

            <DataTable
                className="w-full min-w-[850px]"
                columns={columns}
                data={list}
                loading={isLoading}
                noData={!isLoading && list.length === 0}
                pagingData={{
                    total,
                    pageIndex,
                    pageSize,
                }}
                onPaginationChange={setPageIndex}
            />

            <FixationRestoreDialog
                isOpen={isRestoreOpen}
                fixation={restoreFixation}
                isSubmitting={isRestoring}
                onClose={handleCloseRestore}
                onSubmit={handleSubmitRestore}
            />
        </div>
    )
}

export default RestoreFixationsTab
