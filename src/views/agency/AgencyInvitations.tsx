import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Loading from '@/components/shared/Loading'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import DatePicker from '@/components/ui/DatePicker'
import Switcher from '@/components/ui/Switcher'
import Pagination from '@/components/ui/Pagination'
import { FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiCreateInvitation,
    apiDeleteInvitation,
    apiGetInvitations,
    apiUpdateInvitation,
} from '@/services/InvitationsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    getInvitationToken,
    type CreateInvitationPayload,
    type Invitation,
    type UpdateInvitationPayload,
} from '@/@types/invitation'
import {
    TbCopy,
    TbLink,
    TbPlus,
    TbTrash,
    TbClock,
    TbMailForward,
    TbPencil,
} from 'react-icons/tb'

const { Tr, Th, Td, THead, TBody } = Table

const PAGE_SIZE = 20

const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    const d = dayjs(dateStr)
    if (!d.isValid()) return dateStr
    return d.format('HH:mm DD.MM.YYYY')
}

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    const d = dayjs(dateStr)
    if (!d.isValid()) return dateStr
    return d.format('DD.MM.YYYY')
}

const toYmd = (date: Date | null) =>
    date ? dayjs(date).format('YYYY-MM-DD') : null

const parseYmd = (value?: string | null): Date | null => {
    if (!value) return null
    const d = dayjs(value)
    return d.isValid() ? d.toDate() : null
}

const buildInviteUrl = (token: string) =>
    `${window.location.origin}/invitations/${encodeURIComponent(token)}`

type InvitationFormState = {
    active: boolean
    permanent: boolean
    active_till: string | null
}

type FormMode = 'create' | 'edit'

const defaultCreateForm = (): InvitationFormState => ({
    active: true,
    permanent: true,
    active_till: null,
})

const toEditForm = (invitation: Invitation): InvitationFormState => ({
    active: invitation.active ?? true,
    permanent: invitation.permanent ?? false,
    active_till: invitation.active_till ?? null,
})

const AgencyInvitations = () => {
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Invitation | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formMode, setFormMode] = useState<FormMode | null>(null)
    const [editTarget, setEditTarget] = useState<Invitation | null>(null)
    const [form, setForm] = useState<InvitationFormState | null>(null)

    const loadInvitations = useCallback(async (pageToLoad = page) => {
        setIsLoading(true)
        try {
            const response = await apiGetInvitations({
                with: 'agency',
                page: pageToLoad,
                per_page: PAGE_SIZE,
            })
            const rows = response.data || []
            const totalCount = response.meta?.total ?? rows.length
            const lastPage = Math.max(
                1,
                response.meta?.last_page ??
                    Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
            )

            if (rows.length === 0 && pageToLoad > lastPage) {
                setPage(lastPage)
                return
            }

            setInvitations(rows)
            setTotal(totalCount)
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось загрузить приглашения',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsLoading(false)
        }
    }, [page])

    useEffect(() => {
        void loadInvitations(page)
    }, [loadInvitations, page])

    const openCreate = () => {
        setFormMode('create')
        setEditTarget(null)
        setForm(defaultCreateForm())
    }

    const openEdit = (invitation: Invitation) => {
        setFormMode('edit')
        setEditTarget(invitation)
        setForm(toEditForm(invitation))
    }

    const closeForm = () => {
        if (isSubmitting) return
        setFormMode(null)
        setEditTarget(null)
        setForm(null)
    }

    const validateForm = (state: InvitationFormState) => {
        if (!state.permanent && !state.active_till) {
            toast.push(
                <Notification type="danger">
                    Укажите дату окончания или сделайте приглашение бессрочным
                </Notification>,
                { placement: 'top-center' },
            )
            return false
        }
        return true
    }

    const toPayload = (
        state: InvitationFormState,
    ): CreateInvitationPayload & UpdateInvitationPayload => ({
        active: state.active,
        permanent: state.permanent,
        active_till: state.permanent ? null : state.active_till,
    })

    const handleSubmitForm = async () => {
        if (!form || !formMode) return
        if (!validateForm(form)) return

        const payload = toPayload(form)
        setIsSubmitting(true)

        try {
            if (formMode === 'create') {
                const created = await apiCreateInvitation(payload)
                toast.push(
                    <Notification type="success">
                        Приглашение создано
                    </Notification>,
                    { placement: 'top-center' },
                )

                const token = getInvitationToken(created)
                if (token) {
                    try {
                        await navigator.clipboard.writeText(
                            buildInviteUrl(token),
                        )
                        toast.push(
                            <Notification type="info">
                                Ссылка скопирована в буфер обмена
                            </Notification>,
                            { placement: 'top-center' },
                        )
                    } catch {
                        // clipboard may be unavailable
                    }
                }
            } else if (editTarget) {
                await apiUpdateInvitation(editTarget.id, payload)
                toast.push(
                    <Notification type="success">
                        Приглашение обновлено
                    </Notification>,
                    { placement: 'top-center' },
                )
            }

            setFormMode(null)
            setEditTarget(null)
            setForm(null)

            if (formMode === 'create' && page !== 1) {
                setPage(1)
            } else {
                await loadInvitations(page)
            }
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        formMode === 'create'
                            ? 'Не удалось создать приглашение'
                            : 'Не удалось обновить приглашение',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCopy = async (invitation: Invitation) => {
        const token = getInvitationToken(invitation)
        try {
            await navigator.clipboard.writeText(buildInviteUrl(token))
            toast.push(
                <Notification type="success">Ссылка скопирована</Notification>,
                { placement: 'top-center' },
            )
        } catch {
            toast.push(
                <Notification type="danger">
                    Не удалось скопировать ссылку
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return

        setIsDeleting(true)
        try {
            await apiDeleteInvitation(deleteTarget.id)
            toast.push(
                <Notification type="success">Приглашение удалено</Notification>,
                { placement: 'top-center' },
            )
            setDeleteTarget(null)
            await loadInvitations(page)
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(err, 'Не удалось удалить приглашение')}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Container>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="mb-1">Приглашения в агентство</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Создавайте ссылки для быстрого присоединения агентов
                    </p>
                </div>
                <Button
                    variant="solid"
                    icon={<TbPlus />}
                    className="shrink-0"
                    onClick={openCreate}
                >
                    Создать приглашение
                </Button>
            </div>

            <AdaptiveCard>
                <Loading loading={isLoading}>
                    <Table className="w-full min-w-[980px]">
                        <THead>
                            <Tr>
                                <Th className="w-[22%]">Токен / ссылка</Th>
                                <Th className="w-[13%]">Создано</Th>
                                <Th className="w-[10%]">Активно</Th>
                                <Th className="w-[12%]">Использовано</Th>
                                <Th className="w-[10%]">Бессрочно</Th>
                                <Th className="w-[13%]">Действует до</Th>
                                <Th className="w-[20%] text-right">Действия</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {invitations.length > 0 ? (
                                invitations.map((item) => {
                                    const token = getInvitationToken(item)
                                    const isActive = item.active ?? false
                                    const isUsed = item.used ?? false
                                    const isPermanent = item.permanent ?? false

                                    return (
                                        <Tr key={item.id}>
                                            <Td>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <TbLink className="shrink-0 text-primary text-lg" />
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {token}
                                                        </div>
                                                        {item.agency?.name ? (
                                                            <div className="text-xs text-gray-400 truncate">
                                                                {
                                                                    item.agency
                                                                        .name
                                                                }
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </Td>
                                            <Td className="whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                                    <TbClock className="text-base shrink-0" />
                                                    <span>
                                                        {formatDateTime(
                                                            item.created_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </Td>
                                            <Td className="whitespace-nowrap">
                                                <Tag
                                                    className={`font-semibold border-0 ${
                                                        isActive
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {isActive ? 'Да' : 'Нет'}
                                                </Tag>
                                            </Td>
                                            <Td className="whitespace-nowrap">
                                                <Tag
                                                    className={`font-semibold border-0 ${
                                                        isUsed
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                    }`}
                                                >
                                                    {isUsed
                                                        ? 'Использовано'
                                                        : 'Свободно'}
                                                </Tag>
                                            </Td>
                                            <Td className="whitespace-nowrap">
                                                <Tag
                                                    className={`font-semibold border-0 ${
                                                        isPermanent
                                                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {isPermanent
                                                        ? 'Да'
                                                        : 'Нет'}
                                                </Tag>
                                            </Td>
                                            <Td className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {isPermanent
                                                    ? 'Бессрочно'
                                                    : formatDate(
                                                          item.active_till,
                                                      )}
                                            </Td>
                                            <Td className="text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        icon={<TbCopy />}
                                                        onClick={() =>
                                                            void handleCopy(
                                                                item,
                                                            )
                                                        }
                                                    >
                                                        Копировать
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        icon={<TbPencil />}
                                                        onClick={() =>
                                                            openEdit(item)
                                                        }
                                                    >
                                                        Изменить
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                                        icon={<TbTrash />}
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                item,
                                                            )
                                                        }
                                                    >
                                                        Удалить
                                                    </Button>
                                                </div>
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
                                            <TbMailForward className="text-4xl mb-2" />
                                            <p className="text-sm">
                                                Приглашений пока нет
                                            </p>
                                        </div>
                                    </Td>
                                </Tr>
                            )}
                        </TBody>
                    </Table>
                </Loading>
            </AdaptiveCard>

            {total > PAGE_SIZE ? (
                <div className="mt-4">
                    <Pagination
                        currentPage={page}
                        pageSize={PAGE_SIZE}
                        total={total}
                        pagerCount={5}
                        onChange={setPage}
                    />
                </div>
            ) : null}

            <Dialog
                isOpen={Boolean(formMode && form)}
                onClose={closeForm}
                onRequestClose={closeForm}
            >
                <h4 className="mb-1">
                    {formMode === 'create'
                        ? 'Создать приглашение'
                        : 'Редактировать приглашение'}
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 truncate">
                    {formMode === 'edit' && editTarget
                        ? getInvitationToken(editTarget)
                        : 'Укажите параметры ссылки приглашения'}
                </p>

                {form ? (
                    <div className="space-y-5">
                        <FormItem label="Активно">
                            <div className="flex items-center gap-3">
                                <Switcher
                                    checked={form.active}
                                    onChange={(checked) =>
                                        setForm((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      active: checked,
                                                  }
                                                : prev,
                                        )
                                    }
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {form.active
                                        ? 'Приглашение активно'
                                        : 'Приглашение выключено'}
                                </span>
                            </div>
                        </FormItem>

                        <FormItem label="Бессрочно">
                            <div className="flex items-center gap-3">
                                <Switcher
                                    checked={form.permanent}
                                    onChange={(checked) =>
                                        setForm((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      permanent: checked,
                                                      active_till: checked
                                                          ? null
                                                          : prev.active_till,
                                                  }
                                                : prev,
                                        )
                                    }
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {form.permanent
                                        ? 'Без даты окончания'
                                        : 'С датой окончания'}
                                </span>
                            </div>
                        </FormItem>

                        <FormItem
                            label="Действует до"
                            asterisk={!form.permanent}
                        >
                            <DatePicker
                                placeholder="Выберите дату"
                                locale="ru"
                                inputFormat="DD.MM.YYYY"
                                disabled={form.permanent}
                                value={parseYmd(form.active_till)}
                                onChange={(date) =>
                                    setForm((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  active_till: toYmd(date),
                                              }
                                            : prev,
                                    )
                                }
                            />
                        </FormItem>
                    </div>
                ) : null}

                <div className="mt-8 flex justify-end gap-2">
                    <Button disabled={isSubmitting} onClick={closeForm}>
                        Отмена
                    </Button>
                    <Button
                        variant="solid"
                        loading={isSubmitting}
                        onClick={() => void handleSubmitForm()}
                    >
                        {formMode === 'create' ? 'Создать' : 'Сохранить'}
                    </Button>
                </div>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(deleteTarget)}
                type="danger"
                title="Удалить приглашение"
                confirmText="Удалить"
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: isDeleting,
                    variant: 'solid',
                    className: 'bg-rose-600 hover:bg-rose-700',
                }}
                onClose={() => setDeleteTarget(null)}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => void handleConfirmDelete()}
            >
                <p>
                    Удалить приглашение
                    {deleteTarget
                        ? ` «${getInvitationToken(deleteTarget)}»`
                        : ''}
                    ? Ссылка перестанет работать.
                </p>
            </ConfirmDialog>
        </Container>
    )
}

export default AgencyInvitations
