import { useCallback, useEffect, useMemo, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Loading from '@/components/shared/Loading'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiGetAgencyRequests,
    apiApproveAgencyRequest,
    apiRejectAgencyRequest,
} from '@/services/AgencyService'
import type { AgencyRequestStatus, JoinAgencyRequest } from '@/@types/agency'
import { formatRuPhone } from '@/views/fixations/utils'
import {
    TbBuilding,
    TbCheck,
    TbX,
    TbUser,
    TbClock,
    TbUsers,
    TbRefresh,
    TbPhone,
} from 'react-icons/tb'

const { Tr, Th, Td, THead, TBody } = Table

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
        label: 'Одобрена',
        bgClass: 'bg-emerald-100 dark:bg-emerald-500/20',
        textClass: 'text-emerald-700 dark:text-emerald-400',
    },
    rejected: {
        label: 'Отклонена',
        bgClass: 'bg-rose-100 dark:bg-rose-500/20',
        textClass: 'text-rose-700 dark:text-rose-400',
    },
    cancelled: {
        label: 'Отменена',
        bgClass: 'bg-gray-100 dark:bg-gray-700',
        textClass: 'text-gray-600 dark:text-gray-300',
    },
}

type StatusOption = {
    value: AgencyRequestStatus
    label: string
}

const STATUS_FILTER_OPTIONS: StatusOption[] = [
    { value: 'pending', label: statusConfig.pending.label },
    { value: 'approved', label: statusConfig.approved.label },
    { value: 'rejected', label: statusConfig.rejected.label },
    { value: 'cancelled', label: statusConfig.cancelled.label },
]

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr

    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()

    return `${hh}:${mm} ${day}.${month}.${yyyy}`
}

const resolveSupervisor = (item: JoinAgencyRequest) =>
    item.supervisor || item.agency?.supervisor || null

const AgencyRequests = () => {
    const [requests, setRequests] = useState<JoinAgencyRequest[]>([])
    const [statusFilter, setStatusFilter] = useState<
        AgencyRequestStatus | undefined
    >(undefined)
    const [isLoading, setIsLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedRequest, setSelectedRequest] =
        useState<JoinAgencyRequest | null>(null)
    const [dialogType, setDialogType] = useState<'approve' | 'reject' | null>(
        null,
    )

    const loadRequests = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await apiGetAgencyRequests({
                with: 'agent,agent.profilePicture,agency,agency.supervisor',
                ...(statusFilter ? { status: statusFilter } : {}),
            })
            setRequests(response.data || [])
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Не удалось загрузить заявки'
            toast.push(<Notification type="danger">{msg}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsLoading(false)
        }
    }, [statusFilter])

    useEffect(() => {
        void loadRequests()
    }, [loadRequests])

    const selectedStatus = useMemo(
        () =>
            STATUS_FILTER_OPTIONS.find((item) => item.value === statusFilter) ??
            null,
        [statusFilter],
    )

    const handleConfirmAction = async () => {
        if (!selectedRequest || !dialogType) return

        setActionLoading(true)
        try {
            if (dialogType === 'approve') {
                await apiApproveAgencyRequest(selectedRequest.id)
                toast.push(
                    <Notification type="success">
                        Заявка агента {selectedRequest.agent?.name} одобрена
                    </Notification>,
                    { placement: 'top-center' },
                )
            } else {
                await apiRejectAgencyRequest(selectedRequest.id)
                toast.push(
                    <Notification type="warning">
                        Заявка агента {selectedRequest.agent?.name} отклонена
                    </Notification>,
                    { placement: 'top-center' },
                )
            }
            await loadRequests()
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Произошла ошибка'
            toast.push(<Notification type="danger">{msg}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setActionLoading(false)
            setSelectedRequest(null)
            setDialogType(null)
        }
    }

    return (
        <Container>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h3 className="mb-1">Заявки в агентство</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Список заявок агентов на присоединение к агентству
                    </p>
                </div>
                <div className="w-full sm:w-56">
                    <Select<StatusOption, false>
                        isClearable
                        isSearchable={false}
                        placeholder="Все статусы"
                        options={STATUS_FILTER_OPTIONS}
                        value={selectedStatus}
                        onChange={(option) =>
                            setStatusFilter(option?.value)
                        }
                    />
                </div>
            </div>

            <AdaptiveCard>
                <Loading loading={isLoading}>
                    <div className="overflow-x-auto">
                        <Table className="w-full min-w-[1100px]">
                            <THead>
                                <Tr>
                                    <Th>Агент</Th>
                                    <Th>Телефон</Th>
                                    <Th>Агентство</Th>
                                    <Th>Руководитель</Th>
                                    <Th>Подана</Th>
                                    <Th>Обновлена</Th>
                                    <Th>Статус</Th>
                                    <Th className="text-right">Действия</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {requests.length > 0 ? (
                                    requests.map((item) => {
                                        const status = statusConfig[
                                            item.status
                                        ] || {
                                            label: item.status,
                                            bgClass:
                                                'bg-gray-100 dark:bg-gray-700',
                                            textClass:
                                                'text-gray-600 dark:text-gray-300',
                                        }

                                        const avatarSrc =
                                            item.agent?.profile_picture?.src
                                        const supervisor =
                                            resolveSupervisor(item)

                                        return (
                                            <Tr key={item.id}>
                                                <Td>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            shape="circle"
                                                            size={40}
                                                            src={
                                                                avatarSrc || ''
                                                            }
                                                            className="shrink-0 bg-primary/10 text-primary font-semibold border border-gray-100 dark:border-gray-700"
                                                            icon={<TbUser />}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                {item.agent
                                                                    ?.name ||
                                                                    '—'}
                                                            </div>
                                                            {item.agent
                                                                ?.email ? (
                                                                <div className="text-xs text-gray-400 truncate">
                                                                    {
                                                                        item
                                                                            .agent
                                                                            .email
                                                                    }
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </Td>

                                                <Td className="whitespace-nowrap">
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                                        {item.agent?.phone
                                                            ? formatRuPhone(
                                                                  item.agent
                                                                      .phone,
                                                              )
                                                            : '—'}
                                                    </span>
                                                </Td>

                                                <Td>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <TbBuilding className="shrink-0 text-gray-400" />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {item.agency
                                                                ?.name || '—'}
                                                        </span>
                                                    </div>
                                                </Td>

                                                <Td>
                                                    <div className="min-w-0 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                                                            <TbUser className="shrink-0 text-gray-400" />
                                                            <span>
                                                                {supervisor?.name ||
                                                                    '—'}
                                                            </span>
                                                        </div>
                                                        {supervisor?.phone ? (
                                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                <TbPhone className="shrink-0 text-gray-400" />
                                                                <span>
                                                                    {formatRuPhone(
                                                                        supervisor.phone,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </Td>

                                                <Td className="whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                                        <TbClock className="text-base shrink-0" />
                                                        <span>
                                                            {formatDate(
                                                                item.created_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </Td>

                                                <Td className="whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                        <TbRefresh className="text-base shrink-0 opacity-70" />
                                                        <span>
                                                            {formatDate(
                                                                item.updated_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </Td>

                                                <Td className="whitespace-nowrap">
                                                    <Tag
                                                        className={`font-semibold border-0 ${status.bgClass} ${status.textClass}`}
                                                    >
                                                        {status.label}
                                                    </Tag>
                                                </Td>

                                                <Td className="text-right whitespace-nowrap">
                                                    {item.status ===
                                                    'pending' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="solid"
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                icon={
                                                                    <TbCheck />
                                                                }
                                                                onClick={() => {
                                                                    setSelectedRequest(
                                                                        item,
                                                                    )
                                                                    setDialogType(
                                                                        'approve',
                                                                    )
                                                                }}
                                                            >
                                                                Принять
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="plain"
                                                                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                                icon={<TbX />}
                                                                onClick={() => {
                                                                    setSelectedRequest(
                                                                        item,
                                                                    )
                                                                    setDialogType(
                                                                        'reject',
                                                                    )
                                                                }}
                                                            >
                                                                Отклонить
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </Td>
                                            </Tr>
                                        )
                                    })
                                ) : (
                                    <Tr>
                                        <Td
                                            colSpan={8}
                                            className="text-center py-12"
                                        >
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <TbUsers className="text-4xl mb-2" />
                                                <p className="text-sm">
                                                    Заявок пока нет
                                                </p>
                                            </div>
                                        </Td>
                                    </Tr>
                                )}
                            </TBody>
                        </Table>
                    </div>
                </Loading>
            </AdaptiveCard>

            <ConfirmDialog
                isOpen={Boolean(selectedRequest && dialogType)}
                type={dialogType === 'approve' ? 'info' : 'danger'}
                title={
                    dialogType === 'approve'
                        ? 'Одобрить заявку'
                        : 'Отклонить заявку'
                }
                confirmText={dialogType === 'approve' ? 'Принять' : 'Отклонить'}
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
                <p>
                    {dialogType === 'approve'
                        ? `Принять агента «${selectedRequest?.agent?.name || ''}» в агентство?`
                        : `Отклонить заявку агента «${selectedRequest?.agent?.name || ''}»?`}
                </p>
            </ConfirmDialog>
        </Container>
    )
}

export default AgencyRequests
