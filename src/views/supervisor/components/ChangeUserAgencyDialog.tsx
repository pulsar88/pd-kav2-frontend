import { useCallback, useEffect, useRef, useState } from 'react'
import { components } from 'react-select'
import type { MenuListProps, GroupBase } from 'react-select'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { Form, FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiGetAgencies } from '@/services/AgencyService'
import { apiChangeUserAgency } from '@/services/UsersService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import type { AdminUserListItem } from '@/@types/users'
import { TbBuilding, TbUser } from 'react-icons/tb'
import classNames from '@/utils/classNames'

type AgencyOption = {
    value: number
    label: string
}

type ChangeUserAgencyDialogProps = {
    isOpen: boolean
    user: AdminUserListItem | null
    onClose: () => void
    onSuccess: () => void
}

type AgencySelectProps = {
    isLoadingMore?: boolean
}

const AGENCIES_PER_PAGE = 20

const selectMenuProps = {
    menuPortalTarget:
        typeof document !== 'undefined' ? document.body : undefined,
    menuPosition: 'fixed' as const,
    styles: {
        menuPortal: (base: Record<string, unknown>) => ({
            ...base,
            zIndex: 80,
        }),
    },
}

const toAgencyOptions = (
    items: { id: number; name: string }[],
    excludeAgencyId?: number | null,
): AgencyOption[] =>
    items
        .filter((item) =>
            excludeAgencyId == null ? true : item.id !== excludeAgencyId,
        )
        .map((item) => ({
            value: item.id,
            label: item.name,
        }))

const mergeAgencyOptions = (
    prev: AgencyOption[],
    next: AgencyOption[],
): AgencyOption[] => {
    if (next.length === 0) return prev
    const seen = new Set(prev.map((item) => item.value))
    const uniqueNext = next.filter((item) => !seen.has(item.value))
    return uniqueNext.length > 0 ? [...prev, ...uniqueNext] : prev
}

const AgencyMenuList = (
    props: MenuListProps<AgencyOption, false, GroupBase<AgencyOption>>,
) => {
    const isLoadingMore = Boolean(
        (props.selectProps as AgencySelectProps).isLoadingMore,
    )

    return (
        <>
            <components.MenuList {...props} />
            {isLoadingMore ? (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400">
                    <Spinner size={14} />
                    Загрузка...
                </div>
            ) : null}
        </>
    )
}

const ChangeUserAgencyDialog = ({
    isOpen,
    user,
    onClose,
    onSuccess,
}: ChangeUserAgencyDialogProps) => {
    const currentAgencyId = user?.agency?.id ?? null
    const currentAgencyName = user?.agency?.name

    const [agencies, setAgencies] = useState<AgencyOption[]>([])
    const [selectedAgency, setSelectedAgency] = useState<AgencyOption | null>(
        null,
    )
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoadingAgencies, setIsLoadingAgencies] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const pageRef = useRef(1)
    const hasMoreRef = useRef(false)
    const loadingMoreRef = useRef(false)
    const searchRef = useRef('')
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const resetListState = useCallback(() => {
        setAgencies([])
        setSelectedAgency(null)
        setHasMore(false)
        setIsLoadingMore(false)
        setSearchQuery('')
        searchRef.current = ''
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current)
            searchTimerRef.current = null
        }
        pageRef.current = 1
        hasMoreRef.current = false
        loadingMoreRef.current = false
    }, [])

    useEffect(() => {
        if (!isOpen) {
            resetListState()
            return
        }

        let cancelled = false
        searchRef.current = searchQuery

        const fetchFirstPage = async () => {
            setIsLoadingAgencies(true)
            try {
                const response = await apiGetAgencies({
                    page: 1,
                    per_page: AGENCIES_PER_PAGE,
                    search: searchQuery || undefined,
                })
                if (cancelled) return

                const options = toAgencyOptions(response.data, currentAgencyId)
                const currentPage = response.meta?.current_page ?? 1
                const lastPage = response.meta?.last_page ?? 1
                const more = currentPage < lastPage

                setAgencies(options)
                pageRef.current = currentPage
                hasMoreRef.current = more
                setHasMore(more)
            } catch (err: unknown) {
                if (cancelled) return
                toast.push(
                    <Notification type="danger">
                        {getApiErrorMessage(
                            err,
                            'Не удалось загрузить список агентств',
                        )}
                    </Notification>,
                    { placement: 'top-center' },
                )
            } finally {
                if (!cancelled) setIsLoadingAgencies(false)
            }
        }

        void fetchFirstPage()

        return () => {
            cancelled = true
        }
    }, [isOpen, resetListState, searchQuery, currentAgencyId])

    const handleSearchInputChange = (value: string) => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        searchTimerRef.current = setTimeout(() => {
            searchTimerRef.current = null
            const trimmed = value.trim()
            if (trimmed !== searchRef.current) {
                searchRef.current = trimmed
                setSearchQuery(trimmed)
            }
        }, 500)
    }

    const handleMenuScrollToBottom = useCallback(async () => {
        if (
            loadingMoreRef.current ||
            !hasMoreRef.current ||
            isLoadingAgencies
        ) {
            return
        }

        loadingMoreRef.current = true
        setIsLoadingMore(true)

        const queryAtStart = searchRef.current
        const nextPage = pageRef.current + 1

        try {
            const response = await apiGetAgencies({
                page: nextPage,
                per_page: AGENCIES_PER_PAGE,
                search: queryAtStart || undefined,
            })

            if (searchRef.current !== queryAtStart) return

            const options = toAgencyOptions(response.data, currentAgencyId)
            const currentPage = response.meta?.current_page ?? nextPage
            const lastPage = response.meta?.last_page ?? nextPage
            const more = currentPage < lastPage

            setAgencies((prev) => mergeAgencyOptions(prev, options))
            pageRef.current = currentPage
            hasMoreRef.current = more
            setHasMore(more)
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось загрузить список агентств',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            loadingMoreRef.current = false
            setIsLoadingMore(false)
        }
    }, [isLoadingAgencies, currentAgencyId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !selectedAgency) {
            toast.push(
                <Notification type="warning">
                    Пожалуйста, выберите агентство
                </Notification>,
                { placement: 'top-center' },
            )
            return
        }

        setIsSubmitting(true)
        try {
            await apiChangeUserAgency(user.id, {
                agency_id: selectedAgency.value,
            })
            toast.push(
                <Notification type="success">
                    Агентство пользователя «{user.name}» изменено
                </Notification>,
                { placement: 'top-center' },
            )
            onClose()
            onSuccess()
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось сменить агентство пользователя',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-8rem)]"
            style={{
                content: {
                    position: 'fixed',
                    inset: 'unset',
                    top: '50%',
                    left: '50%',
                    margin: 0,
                    transform: 'translate(-50%, -50%)',
                },
            }}
            width={460}
            contentClassName={classNames(
                'flex min-h-0 flex-col overflow-visible !p-4 sm:!p-6 !my-0 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-8rem)]',
            )}
        >
            <div className="min-w-0">
                <div className="mb-5 flex items-start gap-3 pr-8 sm:items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                        <TbBuilding />
                    </span>
                    <div className="min-w-0">
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">
                            Смена агентства
                        </h4>
                        <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <TbUser className="shrink-0" />
                            <span className="truncate">
                                {user?.name || 'Пользователь'}
                            </span>
                        </p>
                    </div>
                </div>

                {currentAgencyName ? (
                    <Alert showIcon type="warning" className="mb-4">
                        Пользователь будет удалён из текущего агентства «
                        {currentAgencyName}» и переведён в выбранное.
                    </Alert>
                ) : null}

                <Form onSubmit={handleSubmit}>
                    <FormItem label="Новое агентство" asterisk>
                        <Select<AgencyOption>
                            placeholder={
                                isLoadingAgencies
                                    ? 'Загрузка списка агентств...'
                                    : 'Выберите агентство'
                            }
                            options={agencies}
                            value={selectedAgency}
                            isLoading={isLoadingAgencies || isLoadingMore}
                            isSearchable
                            filterOption={() => true}
                            onInputChange={handleSearchInputChange}
                            noOptionsMessage={() => 'Агентства не найдены'}
                            components={{ MenuList: AgencyMenuList }}
                            onMenuScrollToBottom={() => {
                                void handleMenuScrollToBottom()
                            }}
                            onChange={(option) => setSelectedAgency(option)}
                            {...selectMenuProps}
                            {...({ isLoadingMore } satisfies AgencySelectProps)}
                        />
                        {isLoadingAgencies ? (
                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                <Spinner size={12} /> Загрузка списка...
                            </p>
                        ) : hasMore ? (
                            <p className="mt-2 text-xs text-gray-400">
                                Прокрутите список для загрузки следующей
                                страницы
                            </p>
                        ) : null}
                    </FormItem>

                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="plain"
                            className="w-full sm:w-auto"
                            disabled={isSubmitting}
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            className="w-full sm:w-auto"
                            loading={isSubmitting}
                            disabled={!selectedAgency || isLoadingAgencies}
                        >
                            Сменить агентство
                        </Button>
                    </div>
                </Form>
            </div>
        </Dialog>
    )
}

export default ChangeUserAgencyDialog
