import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import DatePicker from '@/components/ui/DatePicker'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
    apiGetFixationExports,
    apiCreateFixationExport,
    apiDeleteFixationExport,
    apiDownloadFixationExport,
    apiGetFixationHouses,
    type FixationExportItem,
} from '@/services/FixationsService'
import { apiGetAgencies } from '@/services/AgencyService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { FIXATION_STATUS_ORDER } from '../dashboard.constants'
import { fixationStatusMap } from '../utils'
import type { FixationStatus } from '../types'
import {
    TbDownload,
    TbTrash,
    TbPlus,
    TbFileSpreadsheet,
    TbAlertCircle,
    TbCheck,
} from 'react-icons/tb'

type Option = {
    value: number | string
    label: string
}

const STATUS_FILTER_OPTIONS: { value: FixationStatus; label: string }[] =
    FIXATION_STATUS_ORDER.map((status) => ({
        value: status,
        label: fixationStatusMap[status].label,
    }))

const EXPORT_STATUS_SELECT_OPTIONS = [
    { value: 'ready', label: 'Готов к скачиванию' },
    { value: 'new', label: 'Новый' },
]

const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '—'
    const k = 1024
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const formatDateToApi = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
}

const formatExportDateTime = (raw?: string | null) => {
    if (!raw) return '—'
    // Обрабатываем формат YYYY-MM-DD HH:mm:ss или ISO
    const date = new Date(raw.replace(' ', 'T') + (raw.includes('Z') || raw.includes('+') ? '' : 'Z'))
    const validDate = Number.isNaN(date.getTime()) ? new Date(raw) : date
    if (Number.isNaN(validDate.getTime())) return raw

    const timePart = validDate.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
    const datePart = validDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
    return `${timePart} ${datePart}`
}

const FixationExportsView = () => {
    const [list, setList] = useState<FixationExportItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [meta, setMeta] = useState<{ current_page?: number; last_page?: number; total?: number }>({})
    const [statusFilter, setStatusFilter] = useState<string>('')

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [exportDateRange, setExportDateRange] = useState<[Date | null, Date | null]>([null, null])
    const [selectedAgencies, setSelectedAgencies] = useState<Option[]>([])
    const [selectedObjects, setSelectedObjects] = useState<Option[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<{ value: string; label: string }[]>([])

    // Agency search & options
    const [agencyOptions, setAgencyOptions] = useState<Option[]>([])
    const [isAgenciesLoading, setIsAgenciesLoading] = useState(false)
    const [agencySearchText, setAgencySearchText] = useState('')
    const agencySearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Object search & options
    const [objectOptions, setObjectOptions] = useState<Option[]>([])
    const [isObjectsLoading, setIsObjectsLoading] = useState(false)
    const [objectSearchText, setObjectSearchText] = useState('')
    const objectSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [downloadingId, setDownloadingId] = useState<number | null>(null)

    const fetchExports = useCallback(
        async (targetPage = 1, status = statusFilter, silent = false) => {
            if (!silent) setIsLoading(true)
            try {
                const res = await apiGetFixationExports({
                    page: targetPage,
                    per_page: 20,
                    status: status || undefined,
                    order: 'desc',
                    sort_by: 'id',
                })
                setList(res.data)
                setMeta({
                    current_page: res.meta?.current_page ?? targetPage,
                    last_page: res.meta?.last_page ?? 1,
                    total: res.meta?.total ?? res.data.length,
                })
                setPage(targetPage)
            } catch (err: unknown) {
                if (!silent) {
                    toast.push(
                        <Notification title="Ошибка" type="danger">
                            {getApiErrorMessage(
                                err,
                                'Не удалось загрузить список экспортов',
                            )}
                        </Notification>,
                    )
                }
            } finally {
                if (!silent) setIsLoading(false)
            }
        },
        [statusFilter],
    )

    useEffect(() => {
        void fetchExports(1)
    }, [fetchExports])

    // Автоматический опрос статуса (polling) каждые 3 секунды, пока есть файлы в обработке
    useEffect(() => {
        const hasPending = list.some((item) => {
            const val = item.status?.value?.toLowerCase()
            const code = item.status?.code?.toLowerCase()
            const isFinished =
                val === 'ready' ||
                code === 'ready' ||
                val === 'completed' ||
                code === 'completed' ||
                val === 'failed' ||
                code === 'failed' ||
                Boolean(item.failed_at) ||
                Boolean(item.file?.src)
            return !isFinished
        })

        if (!hasPending) return

        const timer = setInterval(() => {
            void fetchExports(page, statusFilter, true)
        }, 3000)

        return () => clearInterval(timer)
    }, [fetchExports, list, page, statusFilter])

    const loadAgencies = useCallback((search = '') => {
        setIsAgenciesLoading(true)
        void apiGetAgencies({ per_page: 50, search: search.trim() || undefined })
            .then((res) => {
                const fetched: Option[] = res.data.map((item) => ({ value: item.id, label: item.name }))
                setAgencyOptions((prev) => {
                    const selectedMissing = selectedAgencies.filter(
                        (sel) => !fetched.some((f) => f.value === sel.value),
                    )
                    return [...selectedMissing, ...fetched]
                })
            })
            .catch(() => setAgencyOptions([]))
            .finally(() => setIsAgenciesLoading(false))
    }, [selectedAgencies])

    const loadObjects = useCallback((search = '') => {
        setIsObjectsLoading(true)
        void apiGetFixationHouses({ per_page: 50, search: search.trim() || undefined })
            .then((res) => {
                const fetched: Option[] = (res.list ?? []).map((item) => ({
                    value: Number(item.id),
                    label: item.name,
                }))
                setObjectOptions((prev) => {
                    const selectedMissing = selectedObjects.filter(
                        (sel) => !fetched.some((f) => f.value === sel.value),
                    )
                    return [...selectedMissing, ...fetched]
                })
            })
            .catch(() => setObjectOptions([]))
            .finally(() => setIsObjectsLoading(false))
    }, [selectedObjects])

    useEffect(() => {
        if (!isCreateOpen) return
        loadAgencies('')
        loadObjects('')
    }, [isCreateOpen, loadAgencies, loadObjects])

    const handleAgencySearch = (value: string) => {
        setAgencySearchText(value)
        if (agencySearchTimerRef.current) {
            clearTimeout(agencySearchTimerRef.current)
            agencySearchTimerRef.current = null
        }
        const trimmed = value.trim()
        if (!trimmed) {
            loadAgencies('')
            return
        }
        agencySearchTimerRef.current = setTimeout(() => {
            loadAgencies(trimmed)
        }, 400)
    }

    const handleObjectSearch = (value: string) => {
        setObjectSearchText(value)
        if (objectSearchTimerRef.current) {
            clearTimeout(objectSearchTimerRef.current)
            objectSearchTimerRef.current = null
        }
        const trimmed = value.trim()
        if (!trimmed) {
            loadObjects('')
            return
        }
        objectSearchTimerRef.current = setTimeout(() => {
            loadObjects(trimmed)
        }, 400)
    }

    const handleCreateExport = async () => {
        setIsCreating(true)
        try {
            const payload: {
                agency_id?: number[]
                realty_object_id?: number[]
                status?: string[]
                date_from?: string
                date_to?: string
            } = {}

            if (selectedAgencies.length > 0) {
                payload.agency_id = selectedAgencies.map((opt) => Number(opt.value))
            }
            if (selectedObjects.length > 0) {
                payload.realty_object_id = selectedObjects.map((opt) => Number(opt.value))
            }
            if (selectedStatuses.length > 0) {
                payload.status = selectedStatuses.map((opt) => opt.value)
            }
            if (exportDateRange[0]) {
                payload.date_from = formatDateToApi(exportDateRange[0])
            }
            if (exportDateRange[1]) {
                payload.date_to = formatDateToApi(exportDateRange[1])
            }

            await apiCreateFixationExport(payload)
            toast.push(
                <Notification title="Успешно" type="success">
                    Запрос на экспорт успешно создан
                </Notification>,
            )
            setIsCreateOpen(false)
            setSelectedAgencies([])
            setSelectedObjects([])
            setSelectedStatuses([])
            setExportDateRange([null, null])
            void fetchExports(1)
        } catch (err: unknown) {
            toast.push(
                <Notification title="Ошибка" type="danger">
                    {getApiErrorMessage(err, 'Не удалось запустить экспорт')}
                </Notification>,
            )
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteExport = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        try {
            await apiDeleteFixationExport(deleteId)
            toast.push(
                <Notification title="Успешно" type="success">
                    Файл экспорта удален
                </Notification>,
            )
            setDeleteId(null)
            void fetchExports(page)
        } catch (err: unknown) {
            toast.push(
                <Notification title="Ошибка" type="danger">
                    {getApiErrorMessage(err, 'Не удалось удалить экспорт')}
                </Notification>,
            )
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDownload = async (item: FixationExportItem) => {
        setDownloadingId(item.id)
        try {
            await apiDownloadFixationExport(
                item.id,
                item.file?.file_name || `fixations_export_${item.id}.xlsx`,
            )
        } catch (err: unknown) {
            toast.push(
                <Notification title="Ошибка" type="danger">
                    {getApiErrorMessage(err, 'Не удалось скачать файл экспорта')}
                </Notification>,
            )
        } finally {
            setDownloadingId(null)
        }
    }

    const isReadyStatus = (item: FixationExportItem) => {
        const val = item.status?.value?.toLowerCase()
        const code = item.status?.code?.toLowerCase()
        return val === 'ready' || code === 'ready' || val === 'completed' || code === 'completed' || Boolean(item.file?.src)
    }

    const isFailedStatus = (item: FixationExportItem) => {
        const val = item.status?.value?.toLowerCase()
        const code = item.status?.code?.toLowerCase()
        return val === 'failed' || code === 'failed' || Boolean(item.failed_at)
    }

    const renderStatusBadge = (item: FixationExportItem) => {
        if (isReadyStatus(item)) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <TbCheck className="text-sm" />
                    {item.status?.name || 'Готов к скачиванию'}
                </span>
            )
        }
        if (isFailedStatus(item)) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400">
                    <TbAlertCircle className="text-sm" />
                    {item.status?.name || 'Ошибка'}
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400">
                <Spinner size={12} />
                {item.status?.name || 'В процессе'}
            </span>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button
                        variant="solid"
                        icon={<TbPlus />}
                        onClick={() => setIsCreateOpen(true)}
                    >
                        Сформировать экспорт
                    </Button>
                </div>
                <div className="w-full sm:w-64">
                    <Select
                        isClearable
                        placeholder="Все статусы"
                        options={EXPORT_STATUS_SELECT_OPTIONS}
                        value={
                            statusFilter
                                ? EXPORT_STATUS_SELECT_OPTIONS.find((o) => o.value === statusFilter) ?? null
                                : null
                        }
                        onChange={(opt) => {
                            const val = opt?.value ?? ''
                            setStatusFilter(val)
                            void fetchExports(1, val)
                        }}
                    />
                </div>
            </div>

            {isLoading && list.length === 0 ? (
                <div className="flex min-h-64 items-center justify-center">
                    <Spinner size={32} />
                </div>
            ) : list.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
                    <TbFileSpreadsheet className="mb-2 text-4xl text-gray-400" />
                    <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                        Файлы экспорта отсутствуют
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                        Нажмите кнопку «Сформировать экспорт», чтобы выгрузить фиксации
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Статус</th>
                                <th className="px-4 py-3">Файл</th>
                                {/* <th className="px-4 py-3">Размер</th> */}
                                <th className="px-4 py-3">Дата создания</th>
                                <th className="px-4 py-3 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                            {list.map((item) => {
                                const canDownload = isReadyStatus(item)
                                return (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                            #{item.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            {renderStatusBadge(item)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <TbFileSpreadsheet className="text-lg text-emerald-600" />
                                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                                    {item.file?.file_name ||
                                                        item.file?.name ||
                                                        `Экспорт_${item.id}.xlsx`}
                                                </span>
                                            </div>
                                        </td>
                                        {/* <td className="px-4 py-3">
                                            {formatBytes(item.file?.size)}
                                        </td> */}
                                        <td className="px-4 py-3 text-gray-500">
                                            {formatExportDateTime(
                                                item.generated_at || item.file?.upload_date,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canDownload ? (
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/20"
                                                        icon={<TbDownload className="text-base" />}
                                                        loading={downloadingId === item.id}
                                                        onClick={() => handleDownload(item)}
                                                        title="Скачать файл"
                                                    />
                                                ) : null}
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/20"
                                                    icon={<TbTrash className="text-base" />}
                                                    onClick={() => setDeleteId(item.id)}
                                                    title="Удалить"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {(meta.last_page ?? 1) > 1 ? (
                <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-500">
                        Страница {meta.current_page ?? page} из {meta.last_page ?? 1} (Всего: {meta.total ?? 0})
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            disabled={page <= 1 || isLoading}
                            onClick={() => void fetchExports(page - 1)}
                        >
                            Назад
                        </Button>
                        <Button
                            size="sm"
                            disabled={page >= (meta.last_page ?? 1) || isLoading}
                            onClick={() => void fetchExports(page + 1)}
                        >
                            Вперед
                        </Button>
                    </div>
                </div>
            ) : null}

            <Dialog
                isOpen={isCreateOpen}
                onClose={() => !isCreating && setIsCreateOpen(false)}
                onRequestClose={() => !isCreating && setIsCreateOpen(false)}
                width={540}
            >
                <div className="flex flex-col gap-4">
                    <h4 className="text-lg font-semibold">Сформировать экспорт фиксаций</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Укажите параметры фильтрации для выгрузки. Если фильтры не выбраны, будут экспортированы все фиксации.
                    </p>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Период фиксаций</label>
                        <DatePicker.DatePickerRange
                            placeholder="Выберите период"
                            value={exportDateRange}
                            onChange={(dates) => setExportDateRange(dates)}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Агентства</label>
                        <Select<Option, true>
                            isMulti
                            isSearchable
                            isLoading={isAgenciesLoading}
                            placeholder="Поиск и выбор агентств..."
                            options={agencyOptions}
                            value={selectedAgencies}
                            filterOption={() => true}
                            onInputChange={(val, meta) => {
                                if (meta.action === 'input-change' || val === '') {
                                    handleAgencySearch(val)
                                }
                            }}
                            onChange={(opts) => setSelectedAgencies([...(opts ?? [])])}
                            noOptionsMessage={() => (isAgenciesLoading ? 'Поиск...' : 'Агентства не найдены')}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Объекты</label>
                        <Select<Option, true>
                            isMulti
                            isSearchable
                            isLoading={isObjectsLoading}
                            placeholder="Поиск и выбор объектов..."
                            options={objectOptions}
                            value={selectedObjects}
                            filterOption={() => true}
                            onInputChange={(val, meta) => {
                                if (meta.action === 'input-change' || val === '') {
                                    handleObjectSearch(val)
                                }
                            }}
                            onChange={(opts) => setSelectedObjects([...(opts ?? [])])}
                            noOptionsMessage={() => (isObjectsLoading ? 'Поиск...' : 'Объекты не найдены')}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Статусы фиксаций</label>
                        <Select<{ value: string; label: string }, true>
                            isMulti
                            isSearchable
                            placeholder="Все статусы"
                            options={STATUS_FILTER_OPTIONS}
                            value={selectedStatuses}
                            onChange={(opts) => setSelectedStatuses([...(opts ?? [])])}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            disabled={isCreating}
                            onClick={() => setIsCreateOpen(false)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="solid"
                            loading={isCreating}
                            disabled={!exportDateRange[0] || !exportDateRange[1] || isCreating}
                            onClick={() => void handleCreateExport()}
                        >
                            Экспортировать
                        </Button>
                    </div>
                </div>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(deleteId)}
                type="danger"
                title="Удалить файл экспорта"
                confirmText="Удалить"
                cancelText="Отмена"
                confirmButtonProps={{ loading: isDeleting }}
                onClose={() => !isDeleting && setDeleteId(null)}
                onCancel={() => !isDeleting && setDeleteId(null)}
                onConfirm={() => void handleDeleteExport()}
            >
                <p>Вы действительно хотите удалить этот файл экспорта фиксаций?</p>
            </ConfirmDialog>
        </div>
    )
}

export default FixationExportsView
