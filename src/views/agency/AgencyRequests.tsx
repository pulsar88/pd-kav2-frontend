import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Loading from '@/components/shared/Loading'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiGetAgencyRequests,
    apiApproveAgencyRequest,
    apiRejectAgencyRequest,
} from '@/services/AgencyService'
import type { AgencyRequestStatus, JoinAgencyRequest } from '@/@types/agency'
import { formatRuPhone } from '@/views/fixations/utils'
import { getUserRoleLabel } from '@/constants/roles.constant'
import {
    TbBuilding,
    TbCheck,
    TbX,
    TbUser,
    TbClock,
    TbUsers,
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
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return null

    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()

    return {
        time: `${hh}:${mm}`,
        date: `${day}.${month}.${yyyy}`,
    }
}

const DateTimeCell = ({
    dateStr,
    icon,
}: {
    dateStr?: string
    icon: ReactNode
}) => {
    const formatted = formatDate(dateStr)

    return (
        <div className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <span className="mt-0.5 shrink-0 text-base opacity-70">{icon}</span>
            {formatted ? (
                <div className="min-w-0 leading-snug">
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                        {formatted.time}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatted.date}
                    </div>
                </div>
            ) : (
                <span>—</span>
            )}
        </div>
    )
}

const resolveSupervisor = (item: JoinAgencyRequest) =>
    item.supervisor || item.agency?.supervisor || null

const PAGE_SIZE = 20

const AgencyRequests = () => {
    const [requests, setRequests] = useState<JoinAgencyRequest[]>([])
    const [statusFilter, setStatusFilter] = useState<
        AgencyRequestStatus | undefined
    >(undefined)
    const [pageIndex, setPageIndex] = useState(1)
    const [total, setTotal] = useState(0)
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
                page: pageIndex,
                per_page: PAGE_SIZE,
                with: 'agent,agent.profilePicture,agency,agency.supervisor,reviewer',
                ...(statusFilter ? { status: statusFilter } : {}),
            })
            setRequests(response.data || [])
            setTotal(response.meta?.total ?? response.data?.length ?? 0)
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
    }, [pageIndex, statusFilter])

    useEffect(() => {
        void loadRequests()
    }, [loadRequests])

    const handleStatusFilterChange = (option: StatusOption | null) => {
        setStatusFilter(option?.value)
        setPageIndex(1)
    }

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
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
                                onChange={handleStatusFilterChange}
                            />
                        </div>
                    </div>

                    <Loading loading={isLoading}>
                        <div className="overflow-x-auto">
                            <Table className="w-full min-w-[1100px]">
                                <THead>
                                    <Tr>
                                        <Th>Агент</Th>
                                        <Th>Агентство</Th>
                                        <Th className="whitespace-nowrap">Подана</Th>
                                        <Th className="whitespace-nowrap">
                                            Обновлена
                                        </Th>
                                        <Th>Статус</Th>
                                        <Th>Рассмотрел</Th>
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
                                            const reviewer = item.reviewer
                                            const reviewerRole = getUserRoleLabel(
                                                reviewer?.roles?.[0],
                                            )

                                            return (
                                                <Tr key={item.id}>
                                                    <Td>
                                                        <div className="flex items-center gap-2.5 min-w-[180px]">
                                                            <Avatar
                                                                size={36}
                                                                className="shrink-0"
                                                                {...(avatarSrc
                                                                    ? {
                                                                          src: avatarSrc,
                                                                      }
                                                                    : {
                                                                          icon: (
                                                                              <TbUser />
                                                                          ),
                                                                      })}
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                    {item.agent
                                                                        ?.name ||
                                                                        '—'}
                                                                </div>
                                                                {item.agent
                                                                    ?.phone ? (
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                        <TbPhone className="shrink-0" />
                                                                        <span>
                                                                            {formatRuPhone(
                                                                                item
                                                                                    .agent
                                                                                    .phone,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </Td>

                                                    <Td>
                                                        <div className="min-w-[180px]">
                                                            <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                                                                <TbBuilding className="shrink-0 text-gray-400" />
                                                                <span className="truncate">
                                                                    {item.agency
                                                                        ?.name ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                            {supervisor ? (
                                                                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                    Рук-ль:{' '}
                                                                    {supervisor.name ||
                                                                        supervisor.phone ||
                                                                        '—'}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </Td>

                                                    <Td className="whitespace-nowrap">
                                                        <DateTimeCell
                                                            dateStr={
                                                                item.created_at
                                                            }
                                                            icon={<TbClock />}
                                                        />
                                                    </Td>

                                                    <Td className="whitespace-nowrap">
                                                        <DateTimeCell
                                                            dateStr={
                                                                item.updated_at
                                                            }
                                                            icon={<TbClock />}
                                                        />
                                                    </Td>

                                                    <Td>
                                                        <Tag
                                                            className={`font-semibold border-0 ${status.bgClass} ${status.textClass}`}
                                                        >
                                                            {status.label}
                                                        </Tag>
                                                    </Td>

                                                    <Td>
                                                        <div className="min-w-[160px]">
                                                            {reviewer ? (
                                                                <>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <TbUser className="shrink-0 text-gray-400" />
                                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                            {reviewer.name ||
                                                                                '—'}
                                                                        </span>
                                                                    </div>
                                                                    {reviewer.phone ? (
                                                                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                        <TbPhone className="shrink-0 text-gray-400" />
                                                                        <span>
                                                                            {formatRuPhone(
                                                                                reviewer.phone,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ) : null}
                                                                {reviewerRole !==
                                                                '—' ? (
                                                                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                        {
                                                                            reviewerRole
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </div>
                                                </Td>

                                                <Td className="text-right whitespace-nowrap">
                                                    {item.status ===
                                                    'pending' ? (
                                                        <div className="inline-flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="plain"
                                                                className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                                icon={
                                                                    <TbCheck className="text-lg" />
                                                                }
                                                                title="Принять"
                                                                aria-label="Принять"
                                                                onClick={() => {
                                                                    setSelectedRequest(
                                                                        item,
                                                                    )
                                                                    setDialogType(
                                                                        'approve',
                                                                    )
                                                                }}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="plain"
                                                                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                                icon={
                                                                    <TbX className="text-lg" />
                                                                }
                                                                title="Отклонить"
                                                                aria-label="Отклонить"
                                                                onClick={() => {
                                                                    setSelectedRequest(
                                                                        item,
                                                                    )
                                                                    setDialogType(
                                                                        'reject',
                                                                    )
                                                                }}
                                                            />
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
                                            colSpan={7}
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

                    {total > PAGE_SIZE ? (
                        <div className="mt-4 flex items-center justify-start">
                            <Pagination
                                pageSize={PAGE_SIZE}
                                currentPage={pageIndex}
                                total={total}
                                onChange={(page) => setPageIndex(page)}
                            />
                        </div>
                    ) : null}
                </Loading>
                </div>
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
