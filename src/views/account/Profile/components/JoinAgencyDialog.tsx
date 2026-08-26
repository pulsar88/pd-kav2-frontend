import { useCallback, useEffect, useRef, useState } from 'react'
import { components } from 'react-select'
import type { MenuListProps, GroupBase } from 'react-select'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { Form, FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiGetAgencies,
    apiCreateAgencyRequest,
} from '@/services/AgencyService'
import { TbBuilding } from 'react-icons/tb'
import classNames from '@/utils/classNames'

type AgencyOption = {
    value: number
    label: string
}

type JoinAgencyDialogProps = {
    isOpen: boolean
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
): AgencyOption[] =>
    items.map((item) => ({
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

const JoinAgencyDialog = ({
    isOpen,
    onClose,
    onSuccess,
}: JoinAgencyDialogProps) => {
    const [agencies, setAgencies] = useState<AgencyOption[]>([])
    const [selectedAgency, setSelectedAgency] = useState<AgencyOption | null>(
        null,
    )
    const [isLoadingAgencies, setIsLoadingAgencies] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const pageRef = useRef(1)
    const hasMoreRef = useRef(false)
    const loadingMoreRef = useRef(false)

    const resetListState = useCallback(() => {
        setAgencies([])
        setSelectedAgency(null)
        setHasMore(false)
        setIsLoadingMore(false)
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

        const fetchFirstPage = async () => {
            setIsLoadingAgencies(true)
            try {
                const response = await apiGetAgencies({
                    page: 1,
                    per_page: AGENCIES_PER_PAGE,
                })
                if (cancelled) return

                const options = toAgencyOptions(response.data)
                const currentPage = response.meta?.current_page ?? 1
                const lastPage = response.meta?.last_page ?? 1
                const more = currentPage < lastPage

                setAgencies(options)
                pageRef.current = currentPage
                hasMoreRef.current = more
                setHasMore(more)
            } catch (err: unknown) {
                if (cancelled) return

                const message =
                    err instanceof Error
                        ? err.message
                        : 'Не удалось загрузить список агентств'
                toast.push(
                    <Notification type="danger">{message}</Notification>,
                    { placement: 'top-center' },
                )
            } finally {
                if (!cancelled) {
                    setIsLoadingAgencies(false)
                }
            }
        }

        void fetchFirstPage()

        return () => {
            cancelled = true
        }
    }, [isOpen, resetListState])

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

        const nextPage = pageRef.current + 1

        try {
            const response = await apiGetAgencies({
                page: nextPage,
                per_page: AGENCIES_PER_PAGE,
            })
            const options = toAgencyOptions(response.data)
            const currentPage = response.meta?.current_page ?? nextPage
            const lastPage = response.meta?.last_page ?? nextPage
            const more = currentPage < lastPage

            setAgencies((prev) => mergeAgencyOptions(prev, options))
            pageRef.current = currentPage
            hasMoreRef.current = more
            setHasMore(more)
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Не удалось загрузить список агентств'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            loadingMoreRef.current = false
            setIsLoadingMore(false)
        }
    }, [isLoadingAgencies])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedAgency) {
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
            await apiCreateAgencyRequest({
                agency_id: selectedAgency.value,
            })

            toast.push(
                <Notification type="success">
                    Заявка на присоединение к агентству успешно отправлена
                </Notification>,
                { placement: 'top-center' },
            )
            onClose()
            onSuccess()
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Не удалось отправить заявку'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
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
                <div className="flex items-start sm:items-center gap-3 mb-5 pr-8">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl shrink-0">
                        <TbBuilding />
                    </span>
                    <div className="min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                            Выбор агентства
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Выберите агентство из списка для отправки заявки
                        </p>
                    </div>
                </div>

                <Form onSubmit={handleSubmit}>
                    <FormItem label="Агентство" asterisk>
                        <Select<AgencyOption>
                            placeholder={
                                isLoadingAgencies
                                    ? 'Загрузка списка агентств...'
                                    : 'Выберите агентство'
                            }
                            options={agencies}
                            value={selectedAgency}
                            isDisabled={isLoadingAgencies}
                            isSearchable
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
                                Прокрутите список для загрузки следующей страницы
                            </p>
                        ) : null}
                    </FormItem>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
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
                            Отправить заявку
                        </Button>
                    </div>
                </Form>
            </div>
        </Dialog>
    )
}

export default JoinAgencyDialog
