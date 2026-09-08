import { useCallback, useEffect, useMemo, useState } from 'react'
import DataTable from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useNavigate } from 'react-router'
import {
    apiGetFixationExtendRequests,
    apiApproveFixationExtendRequest,
    apiRejectFixationExtendRequest,
    type FixationExtendRequest,
} from '@/services/FixationsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    formatFixationDate,
    formatFixationDateTime,
    formatFixationPhone,
} from '@/views/fixations/utils'
import type { ColumnDef } from '@/components/shared/DataTable'
import {
    TbCheck,
    TbX,
    TbRefresh,
    TbUser,
    TbBuilding,
    TbPhone,
    TbMessage,
    TbColumns,
} from 'react-icons/tb'

export type ExtendColumnId =
    | 'client'
    | 'object'
    | 'agent'
    | 'extendDays'
    | 'createdAt'

export type ExtendColumnVisibility = Record<ExtendColumnId, boolean>

export const EXTEND_COLUMN_OPTIONS: Array<{
    id: ExtendColumnId
    label: string
}> = [
    { id: 'client', label: 'Клиент' },
    { id: 'object', label: 'ЖК' },
    { id: 'agent', label: 'Агент' },
    { id: 'extendDays', label: 'Продление' },
    { id: 'createdAt', label: 'Дата запроса' },
]

export const DEFAULT_EXTEND_COLUMN_VISIBILITY: ExtendColumnVisibility = {
    client: true,
    object: true,
    agent: true,
    extendDays: true,
    createdAt: true,
}

const STORAGE_KEY = 'agent-cabinet:supervisor-extend-column-visibility'

const loadColumnVisibility = (): ExtendColumnVisibility => {
    if (typeof window === 'undefined') {
        return DEFAULT_EXTEND_COLUMN_VISIBILITY
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_EXTEND_COLUMN_VISIBILITY
        const parsed = JSON.parse(raw) as Partial<ExtendColumnVisibility>
        return {
            ...DEFAULT_EXTEND_COLUMN_VISIBILITY,
            ...parsed,
        }
    } catch {
        return DEFAULT_EXTEND_COLUMN_VISIBILITY
    }
}

const saveColumnVisibility = (visibility: ExtendColumnVisibility) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
}

// Helper functions for safe field extraction
export const getClientName = (item: FixationExtendRequest): string => {
    const client = item.fixation?.client || item.client
    if (client) {
        const parts = [client.last_name, client.name, client.second_name]
            .map((s) => s?.trim())
            .filter(Boolean)
        if (parts.length > 0) return parts.join(' ')
        if (client.name) return client.name
    }
    if (item.fixation?.fullName) return item.fixation.fullName
    return '—'
}

export const getClientPhone = (item: FixationExtendRequest): string => {
    const client = item.fixation?.client || item.client
    if (client?.phones && client.phones.length > 0) {
        const phoneObj = client.phones.find((p) => p?.phone) || client.phones[0]
        if (phoneObj?.phone) return formatFixationPhone(phoneObj.phone)
    }
    if (client?.phone) return formatFixationPhone(client.phone)
    if (item.fixation?.phone) return formatFixationPhone(item.fixation.phone)
    return ''
}

export const getAgentInfo = (item: FixationExtendRequest) => {
    const agent = item.fixation?.agent || item.agent
    const name = agent?.name || '—'
    const phone = agent?.phone ? formatFixationPhone(agent.phone) : ''
    const agencyName =
        (typeof agent?.agency === 'string'
            ? agent.agency
            : agent?.agency?.name) || ''

    return {
        name,
        phone,
        agency: agencyName,
        roles: agent?.roles,
    }
}

export const getObjectName = (item: FixationExtendRequest): string => {
    const object = item.fixation?.object || item.object
    if (object?.name) return object.name
    if (item.fixation?.projectName) return item.fixation.projectName
    if (item.fixation?.objectName) return item.fixation.objectName
    return '—'
}

export const getExtendDays = (item: FixationExtendRequest): number | null => {
    if (typeof item.add_days === 'number') return item.add_days
    if (typeof item.extend_days === 'number') return item.extend_days
    if (typeof item.days === 'number') return item.days
    return null
}

export const getComment = (item: FixationExtendRequest): string => {
    if (item.comment) return item.comment
    if (item.fixation?.comment) return item.fixation.comment
    return '—'
}

export const getRequestStatus = (item: FixationExtendRequest): string => {
    if (typeof item.status === 'string') return item.status.toLowerCase()
    if (item.status && typeof item.status === 'object') {
        const val =
            item.status.code || item.status.value || item.status.name || ''
        return val.toLowerCase()
    }
    return 'pending'
}

const statusConfig: Record<
    string,
    { label: string; bgClass: string; textClass: string }
> = {
    pending: {
        label: 'На рассмотрении',
        bgClass: 'bg-amber-100 dark:bg-amber-500/20',
        textClass: 'text-amber-700 dark:text-amber-400',
    },
    approved: {
        label: 'Одобрен',
        bgClass: 'bg-emerald-100 dark:bg-emerald-500/20',
        textClass: 'text-emerald-700 dark:text-emerald-400',
    },
    rejected: {
        label: 'Отклонен',
        bgClass: 'bg-rose-100 dark:bg-rose-500/20',
        textClass: 'text-rose-700 dark:text-rose-400',
    },
    cancelled: {
        label: 'Отменен',
        bgClass: 'bg-gray-100 dark:bg-gray-700',
        textClass: 'text-gray-600 dark:text-gray-300',
    },
}

const ExtendRequestsTab = () => {
    const navigate = useNavigate()
    const [requests, setRequests] = useState<FixationExtendRequest[]>([])
    const [total, setTotal] = useState(0)
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [isLoading, setIsLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [columnVisibility, setColumnVisibility] =
        useState<ExtendColumnVisibility>(() => loadColumnVisibility())
    const [selectedRequest, setSelectedRequest] =
        useState<FixationExtendRequest | null>(null)
    const [dialogType, setDialogType] = useState<'approve' | 'reject' | null>(
        null,
    )

    useEffect(() => {
        saveColumnVisibility(columnVisibility)
    }, [columnVisibility])

    const handleColumnVisibilityChange = (
        columnId: ExtendColumnId,
        visible: boolean,
    ) => {
        setColumnVisibility((prev) => {
            const next = { ...prev, [columnId]: visible }
            const visibleCount = Object.values(next).filter(Boolean).length
            if (visibleCount === 0) return prev
            return next
        })
    }

    const visibleColumnsCount =
        Object.values(columnVisibility).filter(Boolean).length

    const loadRequests = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await apiGetFixationExtendRequests({
                page: pageIndex,
                page_size: pageSize,
            })
            setRequests(response.list || [])
            setTotal(response.total ?? 0)
        } catch (err: unknown) {
            const msg = getApiErrorMessage(
                err,
                'Не удалось загрузить запросы на продление',
            )
            toast.push(<Notification type="danger">{msg}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsLoading(false)
        }
    }, [pageIndex, pageSize])

    useEffect(() => {
        void loadRequests()
    }, [loadRequests])

    const handleConfirmAction = async () => {
        if (!selectedRequest || !dialogType) return

        setActionLoading(true)
        const clientName = getClientName(selectedRequest)

        try {
            if (dialogType === 'approve') {
                await apiApproveFixationExtendRequest(selectedRequest.id)
                toast.push(
                    <Notification type="success">
                        Запрос на продление для «{clientName}» успешно одобрен
                    </Notification>,
                    { placement: 'top-center' },
                )
            } else {
                await apiRejectFixationExtendRequest(selectedRequest.id)
                toast.push(
                    <Notification type="info">
                        Запрос на продление для «{clientName}» отклонен
                    </Notification>,
                    { placement: 'top-center' },
                )
            }
            setSelectedRequest(null)
            setDialogType(null)
            void loadRequests()
        } catch (err: unknown) {
            const actionText =
                dialogType === 'approve' ? 'одобрить' : 'отклонить'
            const msg = getApiErrorMessage(
                err,
                `Не удалось ${actionText} запрос на продление`,
            )
            toast.push(<Notification type="danger">{msg}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setActionLoading(false)
        }
    }

    const columns: ColumnDef<FixationExtendRequest>[] = useMemo(() => {
        const allColumns: Array<
            ColumnDef<FixationExtendRequest> & { id: string }
        > = [
            {
                id: 'client',
                header: 'Клиент',
                size: 220,
                minSize: 200,
                cell: (props) => {
                    const item = props.row.original
                    const clientName = getClientName(item)
                    const clientPhone = getClientPhone(item)

                    return (
                        <div className="flex flex-col gap-0.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                <TbUser className="shrink-0 text-gray-400" />
                                <span className="whitespace-nowrap">
                                    {clientName}
                                </span>
                            </div>
                            {clientPhone && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    <TbPhone className="shrink-0 text-gray-400" />
                                    <span className="whitespace-nowrap">
                                        {clientPhone}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                id: 'object',
                header: 'ЖК',
                size: 180,
                minSize: 160,
                cell: (props) => {
                    const item = props.row.original
                    const objectName = getObjectName(item)

                    return (
                        <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            <TbBuilding className="shrink-0 text-gray-400" />
                            <span className="whitespace-nowrap">
                                {objectName}
                            </span>
                        </div>
                    )
                },
            },
            {
                id: 'agent',
                header: 'Агент',
                size: 200,
                minSize: 180,
                cell: (props) => {
                    const item = props.row.original
                    const agent = getAgentInfo(item)

                    return (
                        <div className="flex flex-col gap-0.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                <TbUser className="shrink-0 text-gray-400" />
                                <span className="whitespace-nowrap">
                                    {agent.name}
                                </span>
                            </div>
                            {agent.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    <TbPhone className="shrink-0 text-gray-400" />
                                    <span className="whitespace-nowrap">
                                        {agent.phone}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                id: 'extendDays',
                header: 'Продление',
                size: 150,
                minSize: 140,
                cell: (props) => {
                    const item = props.row.original
                    const days = getExtendDays(item)
                    const fixedTill = item.fixation?.fixed_till
                    const comment = getComment(item)

                    return (
                        <div className="flex flex-col gap-1 items-start whitespace-nowrap">
                            {days !== null ? (
                                <Tag className="bg-primary/10 text-primary border-0 font-bold px-2 py-0.5 text-xs whitespace-nowrap">
                                    +{days} дн.
                                </Tag>
                            ) : (
                                <span className="text-gray-400 whitespace-nowrap">
                                    —
                                </span>
                            )}
                            {fixedTill && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    до {formatFixationDate(fixedTill)}
                                </span>
                            )}
                            {comment && comment !== '—' && (
                                <Tooltip title={comment}>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[160px] cursor-help">
                                        <TbMessage className="text-xs shrink-0 opacity-60" />
                                        <span className="truncate">
                                            {comment}
                                        </span>
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                    )
                },
            },
            {
                id: 'createdAt',
                header: 'Дата запроса',
                size: 140,
                minSize: 130,
                cell: (props) => {
                    const item = props.row.original
                    const rawStatus = getRequestStatus(item)
                    const status = statusConfig[rawStatus] || {
                        label: rawStatus,
                        bgClass: 'bg-gray-100 dark:bg-gray-700',
                        textClass: 'text-gray-600 dark:text-gray-300',
                    }
                    const dateStr =
                        item.created_at || item.fixation?.created_at

                    return (
                        <div className="flex flex-col gap-1 items-start whitespace-nowrap">
                            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {dateStr
                                    ? formatFixationDateTime(dateStr)
                                    : '—'}
                            </span>
                            {rawStatus !== 'pending' && (
                                <Tag
                                    className={`font-semibold text-[10px] border-0 py-0.5 px-2 whitespace-nowrap ${status.bgClass} ${status.textClass}`}
                                >
                                    {status.label}
                                </Tag>
                            )}
                        </div>
                    )
                },
            },
            {
                id: 'actions',
                header: 'Действия',
                enableSorting: false,
                size: 90,
                minSize: 80,
                maxSize: 110,
                cell: (props) => {
                    const item = props.row.original
                    const rawStatus = getRequestStatus(item)
                    const isPending = rawStatus === 'pending' || !rawStatus
                    const status = statusConfig[rawStatus] || {
                        label: rawStatus,
                        bgClass: 'bg-gray-100 dark:bg-gray-700',
                        textClass: 'text-gray-600 dark:text-gray-300',
                    }

                    if (!isPending) {
                        return (
                            <Tag
                                className={`font-semibold border-0 text-xs whitespace-nowrap ${status.bgClass} ${status.textClass}`}
                            >
                                {status.label}
                            </Tag>
                        )
                    }

                    return (
                        <div
                            className="flex items-center justify-center gap-1 whitespace-nowrap"
                            data-fixation-action="true"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Tooltip title="Одобрить запрос">
                                <Button
                                    size="xs"
                                    variant="plain"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                                    icon={
                                        <TbCheck className="text-base font-bold" />
                                    }
                                    onClick={() => {
                                        setSelectedRequest(item)
                                        setDialogType('approve')
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="Отклонить запрос">
                                <Button
                                    size="xs"
                                    variant="plain"
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                    icon={
                                        <TbX className="text-base font-bold" />
                                    }
                                    onClick={() => {
                                        setSelectedRequest(item)
                                        setDialogType('reject')
                                    }}
                                />
                            </Tooltip>
                        </div>
                    )
                },
            },
        ]

        return allColumns.filter((column) => {
            if (column.id === 'actions') return true
            return columnVisibility[column.id as ExtendColumnId]
        })
    }, [columnVisibility])

    return (
        <div className="flex flex-col gap-4">
            {/* Панель инструментов: выбор столбцов и обновление */}
            <div className="flex items-center justify-end gap-2">
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
                    {EXTEND_COLUMN_OPTIONS.map((column) => {
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
                    onClick={() => void loadRequests()}
                >
                    Обновить
                </Button>
            </div>

            {/* Таблица с пагинацией и переходом по строке */}
            <DataTable
                className="w-full min-w-[850px]"
                columns={columns}
                data={requests}
                loading={isLoading}
                noData={!isLoading && requests.length === 0}
                pagingData={{
                    total,
                    pageIndex,
                    pageSize,
                }}
                onPaginationChange={setPageIndex}
                onSelectChange={(size) => {
                    setPageSize(size)
                    setPageIndex(1)
                }}
                onRowClick={(row) => {
                    const fixationId = row.fixation?.id ?? row.fixation_id
                    if (fixationId) {
                        navigate(`/fixations/${fixationId}`)
                    }
                }}
            />

            {/* Подтверждение действий Одобрить / Отклонить */}
            <ConfirmDialog
                isOpen={Boolean(selectedRequest && dialogType)}
                type={dialogType === 'approve' ? 'info' : 'danger'}
                title={
                    dialogType === 'approve'
                        ? 'Одобрить запрос на продление'
                        : 'Отклонить запрос на продление'
                }
                confirmText={dialogType === 'approve' ? 'Одобрить' : 'Отклонить'}
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: actionLoading,
                    variant: 'solid',
                    className:
                        dialogType === 'approve'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-rose-600 hover:bg-rose-700',
                }}
                onClose={() => {
                    setSelectedRequest(null)
                    setDialogType(null)
                }}
                onCancel={() => {
                    setSelectedRequest(null)
                    setDialogType(null)
                }}
                onConfirm={handleConfirmAction}
            >
                <div className="space-y-2">
                    <p>
                        {dialogType === 'approve'
                            ? `Вы уверены, что хотите одобрить продление фиксации для клиента «${
                                  selectedRequest
                                      ? getClientName(selectedRequest)
                                      : ''
                              }»`
                            : `Вы уверены, что хотите отклонить запрос на продление фиксации для клиента «${
                                  selectedRequest
                                      ? getClientName(selectedRequest)
                                      : ''
                              }»`}
                        {selectedRequest && getExtendDays(selectedRequest)
                            ? ` на ${getExtendDays(selectedRequest)} дн.?`
                            : '?'}
                    </p>
                    {selectedRequest &&
                        getComment(selectedRequest) !== '—' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Комментарий: «{getComment(selectedRequest)}»
                            </p>
                        )}
                </div>
            </ConfirmDialog>
        </div>
    )
}

export default ExtendRequestsTab
