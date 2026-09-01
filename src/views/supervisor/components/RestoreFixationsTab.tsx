import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import DataTable from '@/components/shared/DataTable'
import { apiGetFixations, apiRestoreFixation } from '@/services/FixationsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { Fixation, GetFixationsResponse } from '@/views/fixations/types'
import {
    formatFixationDate,
    getFixationStatusDisplay,
    getFixationExpiryAccentClass,
} from '@/views/fixations/utils'
import {
    TbRotateClockwise,
    TbRefresh,
    TbBuilding,
    TbUser,
    TbColumns,
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
    const [pageSize, setPageSize] = useState(20)
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

    const visibleColumnsCount = Object.values(columnVisibility).filter(Boolean).length

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)

        void apiGetFixations({
            page: pageIndex,
            page_size: pageSize,
            status: 'expired',
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
    }, [pageIndex, pageSize, refreshKey])

    const list = data?.list ?? []
    const total = data?.total ?? 0

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
                size: 240,
                minSize: 200,
                cell: (props) => (
                    <div className="flex items-start gap-2.5 whitespace-nowrap">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <TbBuilding className="text-base" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                {props.row.original.projectName ||
                                    props.row.original.objectName ||
                                    '—'}
                                {props.row.original.apartment
                                    ? `, кв. ${props.row.original.apartment}`
                                    : ''}
                            </div>
                            {props.row.original.address && (
                                <div className="text-xs text-gray-400 whitespace-nowrap">
                                    {props.row.original.address}
                                </div>
                            )}
                        </div>
                    </div>
                ),
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
                header: 'Создана',
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

            {/* Таблица */}
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
                onSelectChange={(size) => {
                    setPageSize(size)
                    setPageIndex(1)
                }}
            />

            {/* Диалог восстановления */}
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
