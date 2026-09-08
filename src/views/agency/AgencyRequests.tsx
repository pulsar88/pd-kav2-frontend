import { useCallback, useEffect, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Loading from '@/components/shared/Loading'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiGetAgencyRequests,
    apiApproveAgencyRequest,
    apiRejectAgencyRequest,
} from '@/services/AgencyService'
import type { JoinAgencyRequest } from '@/@types/agency'
import { formatRuPhone } from '@/views/fixations/utils'
import {
    TbCheck,
    TbX,
    TbUser,
    TbClock,
    TbUsers,
    TbRefresh,
} from 'react-icons/tb'

const { Tr, Th, Td, THead, TBody } = Table

// Бейджи статусов
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

// Форматирование даты в формат "HH:mm DD.MM.YYYY" (например, "09:50 24.08.2026")
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

const AgencyRequests = () => {
    const [requests, setRequests] = useState<JoinAgencyRequest[]>([])
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
                with: 'agent,agent.profilePicture',
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
    }, [])

    useEffect(() => {
        void loadRequests()
    }, [loadRequests])

    // Подтверждение одобрения / отклонения
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
            {/* Заголовок страницы */}
            <div className="mb-6">
                <h3 className="mb-1">Заявки в агентство</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Список заявок агентов на присоединение к агентству
                </p>
            </div>

            <AdaptiveCard>
                <Loading loading={isLoading}>
                    <Table className="w-full min-w-[850px]">
                        <THead>
                            <Tr>
                                {/* Агент (26%) */}
                                <Th className="w-[26%]">Агент</Th>

                                {/* Телефон (18%) */}
                                <Th className="w-[18%]">Телефон</Th>

                                {/* Подана (16%) */}
                                <Th className="w-[16%]">Подана</Th>

                                {/* Обновлена (16%) */}
                                <Th className="w-[16%]">Обновлена</Th>

                                {/* Статус (11%) */}
                                <Th className="w-[11%]">Статус</Th>

                                {/* Действия (13%) */}
                                <Th className="w-[13%] text-right">Действия</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {requests.length > 0 ? (
                                requests.map((item) => {
                                    const status = statusConfig[
                                        item.status
                                    ] || {
                                        label: item.status,
                                        bgClass: 'bg-gray-100 dark:bg-gray-700',
                                        textClass:
                                            'text-gray-600 dark:text-gray-300',
                                    }

                                    const avatarSrc =
                                        item.agent?.profile_picture?.src

                                    return (
                                        <Tr key={item.id}>
                                            {/* Агент (растягивается) */}
                                            <Td>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        shape="circle"
                                                        size={40}
                                                        src={avatarSrc || ''}
                                                        className="shrink-0 bg-primary/10 text-primary font-semibold border border-gray-100 dark:border-gray-700"
                                                        icon={<TbUser />}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                            {item.agent?.name ||
                                                                '—'}
                                                        </div>
                                                        {item.agent?.email && (
                                                            <div className="text-xs text-gray-400 truncate">
                                                                {
                                                                    item.agent
                                                                        .email
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Td>

                                            {/* Телефон */}
                                            <Td className="whitespace-nowrap">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                                    {item.agent?.phone
                                                        ? formatRuPhone(
                                                              item.agent.phone,
                                                          )
                                                        : '—'}
                                                </span>
                                            </Td>

                                            {/* Подана */}
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

                                            {/* Обновлена */}
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

                                            {/* Статус */}
                                            <Td className="whitespace-nowrap">
                                                <Tag
                                                    className={`font-semibold border-0 ${status.bgClass} ${status.textClass}`}
                                                >
                                                    {status.label}
                                                </Tag>
                                            </Td>

                                            {/* Действия */}
                                            <Td className="text-right whitespace-nowrap">
                                                {item.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="solid"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            icon={<TbCheck />}
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
                                        colSpan={6}
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
                </Loading>
            </AdaptiveCard>

            {/* Модальное окно подтверждения */}
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
