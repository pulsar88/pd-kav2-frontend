import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import DataTable from '@/components/shared/DataTable'
import {
    apiGetFixations,
    apiCreateFixationExtendRequest,
} from '@/services/FixationsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { TbCalendarPlus, TbCalendarTime, TbEye } from 'react-icons/tb'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { Fixation, GetFixationsResponse } from '../types'
import {
    fixationStatusMap,
    formatFixationDate,
    getFixationStatusDisplay,
    getFixationExpiryAccentClass,
} from '../utils'
import {
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
}

const FixationsTable = ({ refreshKey = 0 }: FixationsTableProps) => {
    const navigate = useNavigate()
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [search, setSearch] = useState('')
    const [columnVisibility, setColumnVisibility] =
        useState<FixationColumnVisibility>(() => loadFixationColumnVisibility())
    const [extendFixation, setExtendFixation] = useState<Fixation | null>(null)
    const [isExtendOpen, setIsExtendOpen] = useState(false)
    const [isExtendSubmitting, setIsExtendSubmitting] = useState(false)
    const [data, setData] = useState<GetFixationsResponse | undefined>(
        undefined,
    )
    const [isLoading, setIsLoading] = useState(true)
    const [refreshCount, setRefreshCount] = useState(0)

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)

        void apiGetFixations({
            page: pageIndex,
            page_size: pageSize,
            search: search || undefined,
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
    }, [pageIndex, pageSize, refreshCount, refreshKey, search])

    const list = data?.list ?? []
    const total = data?.total ?? 0

    useEffect(() => {
        saveFixationColumnVisibility(columnVisibility)
    }, [columnVisibility])

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
                                <Tooltip title="Запрос на продление уже существует">
                                    <span className="inline-flex cursor-default items-center justify-center p-1 text-amber-500 dark:text-amber-400">
                                        <TbCalendarTime className="text-lg" />
                                    </span>
                                </Tooltip>
                            ) : (
                                <Tooltip
                                    title={
                                        canExtend
                                            ? 'Создать заявку на продление'
                                            : 'Продление недоступно'
                                    }
                                >
                                    <span className="inline-flex">
                                        <Button
                                            size="xs"
                                            variant="plain"
                                            icon={<TbCalendarPlus />}
                                            disabled={!canExtend}
                                            onClick={() =>
                                                handleOpenExtend(fixation)
                                            }
                                        />
                                    </span>
                                </Tooltip>
                            )}
                        </div>
                    )
                },
            },
        ]

        return allColumns.filter((column) => {
            if (column.id === 'actions') return true
            return columnVisibility[column.id as FixationColumnId]
        })
    }, [columnVisibility])

    const pageData = list

    return (
        <div className="flex flex-col gap-4">
            <FixationsTableTools
                columnVisibility={columnVisibility}
                onSearchChange={handleSearchChange}
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
                onSelectChange={(size) => {
                    setPageSize(size)
                    setPageIndex(1)
                }}
                onRowClick={(row) => navigate(`/fixations/${row.id}`)}
            />
            <FixationExtendRequestDialog
                isOpen={isExtendOpen}
                fixation={extendFixation}
                isSubmitting={isExtendSubmitting}
                onClose={handleCloseExtend}
                onSubmit={handleSubmitExtend}
            />
        </div>
    )
}

export default FixationsTable
