import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Spinner from '@/components/ui/Spinner'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Loading from '@/components/shared/Loading'
import {
    apiGetFixation,
    apiGetFixationGigalogs,
    type FixationGigalogItem,
} from '@/services/FixationsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    TbAlertTriangle,
    TbArrowLeft,
    TbBriefcase,
    TbClock,
    TbClockPlus,
    TbEdit,
    TbPlus,
    TbRefresh,
    TbX,
} from 'react-icons/tb'
import type { ReactNode } from 'react'
import type { Fixation } from './types'
import {
    formatFixationDate,
    formatFixationDateTime,
    formatFixationKinship,
    getFixationExpiryAccentClass,
    getFixationStatusDisplay,
} from './utils'

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-3 last:border-b-0 dark:border-gray-700/60">
        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
            {label}
        </span>
        <div className="min-w-0 flex-1 text-right text-sm font-medium text-gray-900 dark:text-gray-100 break-words [overflow-wrap:anywhere]">
            {value || '—'}
        </div>
    </div>
)

const SectionCard = ({
    title,
    children,
    className = '',
    contentClassName = '',
    scrollable = false,
}: {
    title: string
    children: ReactNode
    className?: string
    contentClassName?: string
    scrollable?: boolean
}) => (
    <AdaptiveCard
        className={
            scrollable
                ? `flex min-h-0 flex-col overflow-hidden w-full min-w-0 ${className}`
                : `w-full min-w-0 overflow-hidden ${className}`
        }
        bodyClass={
            scrollable
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : undefined
        }
    >
        <h4
            className={`font-semibold ${scrollable ? 'mb-2 shrink-0' : 'mb-3'}`}
        >
            {title}
        </h4>
        <div
            className={
                scrollable
                    ? `min-h-0 flex-1 overflow-y-auto ${contentClassName}`
                    : contentClassName
            }
        >
            {children}
        </div>
    </AdaptiveCard>
)

const SummaryStat = ({
    label,
    value,
    accentClassName = '',
}: {
    label: string
    value: ReactNode
    accentClassName?: string
}) => (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
        </p>
        <div
            className={
                accentClassName
                    ? `mt-2 text-lg break-words [overflow-wrap:anywhere] ${accentClassName}`
                    : 'mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100 break-words [overflow-wrap:anywhere]'
            }
        >
            {value || '—'}
        </div>
    </div>
)

const FixationExpiryDate = ({ value }: { value: string }) => (
    <span
        className={`whitespace-nowrap ${getFixationExpiryAccentClass(value)}`}
    >
        {formatFixationDate(value)}
    </span>
)

const FIXATION_CLINCH_EVENT_CODE =
    'app.gigalog.res_gen.fixation_clinch_event_res_gen'

const getGigalogStyle = (log: FixationGigalogItem) => {
    const code = log.code?.toLowerCase() || ''
    const msg = log.message.toLowerCase()

    if (
        code === FIXATION_CLINCH_EVENT_CODE ||
        code.includes('fixation_clinch_event')
    ) {
        return {
            icon: TbAlertTriangle,
            label: 'Важно',
            cardClassName:
                'bg-rose-50/80 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-800/40',
            barClassName: 'bg-rose-500',
            metaClassName: 'text-rose-600 dark:text-rose-400',
        }
    }
    if (code.includes('restored') || msg.includes('восстановлен')) {
        return {
            icon: TbRefresh,
            label: 'Восстановление',
            cardClassName:
                'bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/40',
            barClassName: 'bg-emerald-500',
            metaClassName: 'text-emerald-600 dark:text-emerald-400',
        }
    }
    if (code.includes('expired') || msg.includes('истекл')) {
        return {
            icon: TbClock,
            label: 'Истечение',
            cardClassName:
                'bg-orange-50/80 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-800/40',
            barClassName: 'bg-orange-500',
            metaClassName: 'text-orange-600 dark:text-orange-400',
        }
    }
    if (code.includes('rejected') || msg.includes('отклон')) {
        return {
            icon: TbX,
            label: 'Отклонение',
            cardClassName:
                'bg-rose-50/80 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-800/40',
            barClassName: 'bg-rose-500',
            metaClassName: 'text-rose-600 dark:text-rose-400',
        }
    }
    if (code.includes('created') || msg.includes('создан')) {
        return {
            icon: TbPlus,
            label: 'Создание',
            cardClassName:
                'bg-blue-50/80 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-800/40',
            barClassName: 'bg-blue-500',
            metaClassName: 'text-blue-600 dark:text-blue-400',
        }
    }
    if (code.includes('status') || msg.includes('статус')) {
        return {
            icon: TbRefresh,
            label: 'Смена статуса',
            cardClassName:
                'bg-violet-50/80 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-800/40',
            barClassName: 'bg-violet-500',
            metaClassName: 'text-violet-600 dark:text-violet-400',
        }
    }
    if (code.includes('extended') || msg.includes('продлен')) {
        return {
            icon: TbClockPlus,
            label: 'Продление',
            cardClassName:
                'bg-teal-50/80 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-800/40',
            barClassName: 'bg-teal-500',
            metaClassName: 'text-teal-600 dark:text-teal-400',
        }
    }

    return {
        icon: TbEdit,
        label: log.group?.name || 'Обновление',
        cardClassName:
            'bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700',
        barClassName: 'bg-primary',
        metaClassName: 'text-primary',
    }
}

const renderGigalogMeta = (meta?: FixationGigalogItem['meta']) => {
    if (!meta || Array.isArray(meta) || typeof meta !== 'object') {
        return null
    }

    const oldObj =
        ((meta as { old?: Record<string, unknown> }).old as Record<
            string,
            unknown
        >) ?? {}
    const newObj =
        ((meta as { attributes?: Record<string, unknown> })
            .attributes as Record<string, unknown>) ?? {}

    const changes: ReactNode[] = []

    // 1. Status change
    if (oldObj.status || newObj.status) {
        const oldStatusObj =
            typeof oldObj.status === 'object' && oldObj.status
                ? (oldObj.status as { value?: string; name?: string })
                : {
                      value: String(oldObj.status || ''),
                      name: String(oldObj.status || ''),
                  }
        const newStatusObj =
            typeof newObj.status === 'object' && newObj.status
                ? (newObj.status as { value?: string; name?: string })
                : {
                      value: String(newObj.status || ''),
                      name: String(newObj.status || ''),
                  }

        const oldDisplay = getFixationStatusDisplay({
            status: (oldStatusObj.value || 'pending') as any,
            statusLabel: oldStatusObj.name || oldStatusObj.value,
        })
        const newDisplay = getFixationStatusDisplay({
            status: (newStatusObj.value || 'pending') as any,
            statusLabel: newStatusObj.name || newStatusObj.value,
        })

        changes.push(
            <div
                key="status-diff"
                className="mt-2 flex flex-wrap items-center gap-1.5 text-xs"
            >
                <span className="text-gray-500 dark:text-gray-400">
                    Статус:
                </span>
                {oldStatusObj.name || oldStatusObj.value ? (
                    <>
                        <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${oldDisplay.className}`}
                        >
                            {oldDisplay.label}
                        </span>
                        <span className="text-gray-400">→</span>
                    </>
                ) : null}
                <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${newDisplay.className}`}
                >
                    {newDisplay.label}
                </span>
            </div>,
        )
    }

    // 2. Fixed till change
    if (oldObj.fixed_till || newObj.fixed_till) {
        const oldDate = oldObj.fixed_till
            ? formatFixationDate(String(oldObj.fixed_till))
            : null
        const newDate = newObj.fixed_till
            ? formatFixationDate(String(newObj.fixed_till))
            : null

        changes.push(
            <div
                key="fixed-till-diff"
                className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs"
            >
                <span className="text-gray-500 dark:text-gray-400">
                    Срок фиксации:
                </span>
                {oldDate ? (
                    <>
                        <span className="text-gray-500 line-through">
                            {oldDate}
                        </span>
                        <span className="text-gray-400">→</span>
                    </>
                ) : null}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {newDate || '—'}
                </span>
            </div>,
        )
    }

    // 3. Other attributes
    Object.keys(newObj).forEach((key) => {
        if (key === 'status' || key === 'fixed_till' || key === 'loaded') return
        const oldVal = oldObj[key]
        const newVal = newObj[key]
        if (oldVal !== undefined || newVal !== undefined) {
            changes.push(
                <div
                    key={key}
                    className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
                >
                    <span className="text-gray-500">{key}:</span>
                    {oldVal !== undefined ? (
                        <>
                            <span className="line-through">
                                {typeof oldVal === 'object'
                                    ? JSON.stringify(oldVal)
                                    : String(oldVal)}
                            </span>
                            <span className="text-gray-400">→</span>
                        </>
                    ) : null}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof newVal === 'object'
                            ? JSON.stringify(newVal)
                            : String(newVal)}
                    </span>
                </div>,
            )
        }
    })

    if (changes.length === 0) return null

    return <div className="mt-1.5 space-y-1">{changes}</div>
}

const fixationObjectFields = [
    { key: 'name', label: 'Название' },
    { key: 'facing', label: 'Отделка' },
    { key: 'material', label: 'Материал' },
    { key: 'building_state', label: 'Состояние здания' },
    { key: 'development_start', label: 'Начало строительства' },
    { key: 'development_end', label: 'Окончание строительства' },
    { key: 'address', label: 'Адрес' },
] as const

const formatObjectFieldValue = (value: unknown) => {
    if (value == null || value === '') {
        return '—'
    }

    const str = String(value).trim()
    const lower = str.toLowerCase().replace(/ё/g, 'е')
    if (
        !lower ||
        lower === '—' ||
        lower === '-' ||
        lower === 'null' ||
        lower === 'undefined' ||
        lower.includes('не определен') ||
        lower.includes('не указан')
    ) {
        return '—'
    }

    return str
}

const FixationDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState<Fixation | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(id))

    const [gigalogs, setGigalogs] = useState<FixationGigalogItem[]>([])
    const [isGigalogsLoading, setIsGigalogsLoading] = useState(false)
    const [isGigalogsLoadingMore, setIsGigalogsLoadingMore] = useState(false)
    const [gigalogsPage, setGigalogsPage] = useState(1)
    const [gigalogsHasMore, setGigalogsHasMore] = useState(false)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    const fetchGigalogs = useCallback(
        async (page: number, append = false) => {
            if (!id) return
            if (append) {
                setIsGigalogsLoadingMore(true)
            } else {
                setIsGigalogsLoading(true)
            }

            try {
                const response = await apiGetFixationGigalogs(id, {
                    page,
                    per_page: 20,
                })
                const items = Array.isArray(response?.data) ? response.data : []
                const lastPage = response?.meta?.last_page ?? 1
                const currentPage = response?.meta?.current_page ?? page

                setGigalogs((prev) => (append ? [...prev, ...items] : items))
                setGigalogsPage(currentPage)
                setGigalogsHasMore(currentPage < lastPage)
            } catch {
                if (!append) {
                    setGigalogs([])
                }
            } finally {
                setIsGigalogsLoading(false)
                setIsGigalogsLoadingMore(false)
            }
        },
        [id],
    )

    useEffect(() => {
        if (!id) {
            setData(null)
            setError(null)
            setIsLoading(false)
            setGigalogs([])
            setGigalogsHasMore(false)
            return
        }

        let cancelled = false
        setIsLoading(true)
        setError(null)

        void apiGetFixation(id)
            .then((response) => {
                if (!cancelled) {
                    setData(response)
                    setError(null)
                }
            })
            .catch((err: unknown) => {
                if (cancelled) return

                const message = getApiErrorMessage(
                    err,
                    'Не удалось загрузить фиксацию',
                )
                setData(null)
                setError(message)
                toast.push(
                    <Notification type="danger">{message}</Notification>,
                    { placement: 'top-center' },
                )
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        void fetchGigalogs(1, false)

        return () => {
            cancelled = true
        }
    }, [id, fetchGigalogs])

    useEffect(() => {
        if (!gigalogsHasMore || isGigalogsLoading || isGigalogsLoadingMore) {
            return
        }

        const el = loadMoreRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0]?.isIntersecting &&
                    gigalogsHasMore &&
                    !isGigalogsLoading &&
                    !isGigalogsLoadingMore
                ) {
                    void fetchGigalogs(gigalogsPage + 1, true)
                }
            },
            { threshold: 0.1 },
        )

        observer.observe(el)

        return () => {
            observer.disconnect()
        }
    }, [
        gigalogsHasMore,
        isGigalogsLoading,
        isGigalogsLoadingMore,
        gigalogsPage,
        fetchGigalogs,
    ])

    const status = data ? getFixationStatusDisplay(data) : null

    return (
        <Container>
            <Loading loading={isLoading}>
                {!data ? (
                    <AdaptiveCard>
                        <div className="flex flex-col items-start gap-4 py-6">
                            <h3>
                                {error
                                    ? 'Произошла ошибка'
                                    : 'Фиксация не найдена'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {error ||
                                    'Запись с таким ID отсутствует в списке фиксаций'}
                            </p>
                            <Button
                                icon={<TbArrowLeft />}
                                onClick={() => navigate('/fixations')}
                            >
                                К списку фиксаций
                            </Button>
                        </div>
                    </AdaptiveCard>
                ) : (
                    <div className="grid items-start gap-4 xl:grid-cols-5 w-full min-w-0">
                        <div className="flex flex-col gap-4 xl:col-span-3 w-full min-w-0">
                            <AdaptiveCard className="w-full min-w-0 overflow-hidden">
                                <Button
                                    type="button"
                                    size="sm"
                                    className="mb-3"
                                    icon={<TbArrowLeft />}
                                    onClick={() => navigate('/fixations')}
                                >
                                    К списку фиксаций
                                </Button>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="mb-0 text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        Фиксация #{data.id}
                                    </h2>
                                    {status ? (
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <SummaryStat
                                        label="Клиент"
                                        value={
                                            <div>
                                                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words [overflow-wrap:anywhere]">
                                                    {data.fullName || '—'}
                                                </div>
                                                <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400 break-words">
                                                    {data.phone || '—'}
                                                </div>
                                            </div>
                                        }
                                    />
                                    <SummaryStat
                                        label="ЖК"
                                        value={
                                            <div>
                                                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words [overflow-wrap:anywhere]">
                                                    {data.projectName || '—'}
                                                </div>
                                                {data.apartment ? (
                                                    <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400 break-words">
                                                        {data.apartment}
                                                    </div>
                                                ) : null}
                                            </div>
                                        }
                                    />
                                    <SummaryStat
                                        label="Срок фиксации"
                                        value={
                                            <FixationExpiryDate
                                                value={data.expiresAt}
                                            />
                                        }
                                    />
                                    <SummaryStat
                                        label="Ответственный агент"
                                        value={
                                            <div className="break-words [overflow-wrap:anywhere]">
                                                {data.agent.fullName || '—'}
                                            </div>
                                        }
                                    />
                                </div>
                            </AdaptiveCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start w-full min-w-0">
                                <div className="flex flex-col gap-4 w-full min-w-0">
                                    <SectionCard title="Основная информация">
                                        <InfoRow
                                            label="ФИО клиента"
                                            value={data.fullName}
                                        />
                                        <InfoRow
                                            label="Телефон клиента"
                                            value={data.phone}
                                        />
                                        <InfoRow
                                            label="Менеджер"
                                            value={data.managerName}
                                        />
                                        <InfoRow
                                            label="Телефон менеджера"
                                            value={data.managerPhone}
                                        />
                                        <InfoRow
                                            label="Бюджет"
                                            value={
                                                data.budget
                                                    ? `${data.budget} ₽`
                                                    : undefined
                                            }
                                        />
                                        <InfoRow
                                            label="Количество комнат"
                                            value={data.desiredRooms}
                                        />
                                        <InfoRow
                                            label="Желаемая площадь"
                                            value={
                                                data.desiredArea
                                                    ? `${data.desiredArea} м²`
                                                    : undefined
                                            }
                                        />
                                        <InfoRow
                                            label="Форма оплаты"
                                            value={data.paymentFormat}
                                        />
                                        <InfoRow
                                            label="Дата встречи"
                                            value={
                                                data.meetingDate
                                                    ? formatFixationDate(
                                                          data.meetingDate,
                                                      )
                                                    : undefined
                                            }
                                        />
                                    </SectionCard>

                                    <SectionCard title="Родственники">
                                        {data.relatives &&
                                        data.relatives.length > 0 ? (
                                            <div className="flex flex-col gap-3">
                                                {data.relatives.map(
                                                    (relative) => (
                                                        <div
                                                            key={relative.id}
                                                            className="rounded-xl border border-gray-100 p-3 dark:border-gray-700/60"
                                                        >
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                {
                                                                    relative.fullName
                                                                }
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                <span>
                                                                    {relative.phone ||
                                                                        '—'}
                                                                </span>
                                                                {relative.relation ? (
                                                                    <>
                                                                        <span>
                                                                            •
                                                                        </span>
                                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                            {formatFixationKinship(
                                                                                relative.relation,
                                                                            )}
                                                                        </span>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Родственники не указаны
                                            </p>
                                        )}
                                    </SectionCard>

                                    <SectionCard title="Комментарий">
                                        {data.note ? (
                                            <p className="whitespace-pre-wrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {data.note}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Комментарий не указан
                                            </p>
                                        )}
                                    </SectionCard>
                                </div>

                                <div className="flex flex-col gap-4 w-full min-w-0">
                                    <SectionCard title="Объект">
                                        {data.object ? (
                                            fixationObjectFields.map(
                                                ({ key, label }) => (
                                                    <InfoRow
                                                        key={key}
                                                        label={label}
                                                        value={formatObjectFieldValue(
                                                            key ===
                                                                'building_state'
                                                                ? data.object
                                                                      ?.building_state
                                                                      ?.name
                                                                : data.object?.[
                                                                      key
                                                                  ],
                                                        )}
                                                    />
                                                ),
                                            )
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Объект не указан
                                            </p>
                                        )}
                                    </SectionCard>

                                    <SectionCard title="Контакты агента">
                                        <InfoRow
                                            label="ФИО"
                                            value={data.agent.fullName}
                                        />
                                        <InfoRow
                                            label="Номер"
                                            value={data.agent.phone}
                                        />
                                        <InfoRow
                                            label="Email"
                                            value={data.agent.email}
                                        />
                                        <InfoRow
                                            label="Агентство"
                                            value={data.agent.agency}
                                        />
                                    </SectionCard>
                                </div>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-col gap-4 xl:sticky xl:top-20 xl:col-span-2 xl:self-start w-full min-w-0">
                            <SectionCard
                                title={`История (${gigalogs.length})`}
                                scrollable
                                className="max-h-[70vh] xl:max-h-none xl:h-[calc(100vh-6.5rem)]"
                                contentClassName="checkboard-scroll pr-1"
                            >
                                {isGigalogsLoading ? (
                                    <div className="flex h-40 items-center justify-center">
                                        <Spinner size={30} />
                                    </div>
                                ) : gigalogs.length === 0 ? (
                                    <p className="py-2 text-sm text-gray-500">
                                        История пуста
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-3 py-1">
                                        {gigalogs.map((item) => {
                                            const historyStyle =
                                                getGigalogStyle(item)
                                            const HistoryIcon =
                                                historyStyle.icon

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`relative overflow-hidden rounded-xl p-3 pl-4 text-left shadow-xs ${historyStyle.cardClassName}`}
                                                >
                                                    <span
                                                        className={`absolute inset-y-0 left-0 w-1 ${historyStyle.barClassName}`}
                                                        aria-hidden
                                                    />
                                                    <div className="mb-1.5 flex items-center justify-between gap-2">
                                                        <div
                                                            className={`flex items-center gap-2 ${historyStyle.metaClassName}`}
                                                        >
                                                            <HistoryIcon className="text-base" />
                                                            <span className="text-xs font-semibold uppercase tracking-wider">
                                                                {
                                                                    historyStyle.label
                                                                }
                                                            </span>
                                                        </div>
                                                        <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                                            {formatFixationDateTime(
                                                                item.created_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
                                                        {item.message}
                                                    </div>
                                                    {renderGigalogMeta(
                                                        item.meta,
                                                    )}
                                                </div>
                                            )
                                        })}

                                        {isGigalogsLoadingMore ? (
                                            <div className="flex justify-center py-2">
                                                <Spinner size={24} />
                                            </div>
                                        ) : null}

                                        <div
                                            ref={loadMoreRef}
                                            className="h-2 w-full"
                                        />
                                    </div>
                                )}
                            </SectionCard>
                        </div>
                    </div>
                )}
            </Loading>
        </Container>
    )
}

export default FixationDetails
