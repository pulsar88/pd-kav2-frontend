import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Loading from '@/components/shared/Loading'
import Masonry from '@/components/shared/Masonry'
import { apiGetFixation } from '@/services/FixationsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    TbArrowLeft,
    TbBriefcase,
    TbBuilding,
    TbCalendar,
    TbClock,
    TbClockPlus,
    TbMessage,
    TbPlus,
    TbRefresh,
    TbTrash,
    TbX,
} from 'react-icons/tb'
import type { ReactNode } from 'react'
import type { Fixation, FixationHistoryType } from './types'
import {
    formatFixationDate,
    formatFixationDateTime,
    getFixationExpiryAccentClass,
    getFixationHistoryStyle,
    getFixationStatusDisplay,
} from './utils'

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0 dark:border-gray-700/60">
        <span className="text-sm text-gray-500 dark:text-gray-400">
            {label}
        </span>
        <div className="max-w-[65%] text-right text-sm font-medium text-gray-900 dark:text-gray-100">
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
                ? `flex min-h-0 flex-col overflow-hidden ${className}`
                : className
        }
        bodyClass={
            scrollable
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : undefined
        }
    >
        <h4
            className={`font-semibold ${scrollable ? 'mb-2 shrink-0' : 'mb-2'}`}
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
    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
        </p>
        <div
            className={
                accentClassName
                    ? `mt-2 text-lg ${accentClassName}`
                    : 'mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100'
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

const fixationHistoryIconMap: Record<FixationHistoryType, typeof TbPlus> = {
    created: TbPlus,
    status_changed: TbRefresh,
    crm: TbBriefcase,
    expired: TbClock,
    rejected: TbX,
    deleted: TbTrash,
    comment: TbMessage,
    meeting: TbCalendar,
    extended: TbClockPlus,
    object_changed: TbBuilding,
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

    return String(value)
}

const FixationDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState<Fixation | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(id))

    useEffect(() => {
        if (!id) {
            setData(null)
            setError(null)
            setIsLoading(false)
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

        return () => {
            cancelled = true
        }
    }, [id])

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
                    <div className="grid items-start gap-4 xl:grid-cols-5">
                        <div className="flex flex-col gap-4 xl:col-span-3">
                            <AdaptiveCard>
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
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <SummaryStat
                                        label="Клиент"
                                        value={
                                            <div>
                                                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                                    {data.fullName || '—'}
                                                </div>
                                                <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {data.phone || '—'}
                                                </div>
                                            </div>
                                        }
                                    />
                                    <SummaryStat
                                        label="ЖК"
                                        value={
                                            <div>
                                                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                                    {data.projectName || '—'}
                                                </div>
                                                {data.apartment ? (
                                                    <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {data.apartment}
                                                    </div>
                                                ) : null}
                                            </div>
                                        }
                                    />
                                    <SummaryStat
                                        label="Менеджер"
                                        value={
                                            <div>
                                                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                                    {data.managerName || '—'}
                                                </div>
                                                <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {data.managerPhone || '—'}
                                                </div>
                                            </div>
                                        }
                                    />
                                    <SummaryStat
                                        label="Дата истечения"
                                        value={
                                            <FixationExpiryDate
                                                value={data.expiresAt}
                                            />
                                        }
                                    />
                                </div>
                            </AdaptiveCard>

                            <Masonry columns={{ 0: 1, 1024: 2 }} gap={16}>
                                <SectionCard title="Основное">
                                    <InfoRow
                                        label="Статус"
                                        value={
                                            status ? (
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                                                >
                                                    {status.label}
                                                </span>
                                            ) : (
                                                '—'
                                            )
                                        }
                                    />
                                    <InfoRow
                                        label="Объект"
                                        value={data.object?.name || '—'}
                                    />
                                    <InfoRow
                                        label="Адрес"
                                        value={data.address}
                                    />
                                    {data.apartment ? (
                                        <InfoRow
                                            label="Помещение"
                                            value={data.apartment}
                                        />
                                    ) : null}
                                    <InfoRow
                                        label="Менеджер"
                                        value={
                                            data.managerName ? (
                                                <div>
                                                    <div>
                                                        {data.managerName}
                                                    </div>
                                                    {data.managerPhone ? (
                                                        <div className="mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                            {data.managerPhone}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                '—'
                                            )
                                        }
                                    />
                                    <InfoRow
                                        label="Дата создания"
                                        value={formatFixationDate(
                                            data.createdAt,
                                        )}
                                    />
                                    <InfoRow
                                        label="Дата истечения"
                                        value={
                                            <FixationExpiryDate
                                                value={data.expiresAt}
                                            />
                                        }
                                    />
                                </SectionCard>

                                <SectionCard title="Предпочтения">
                                    <InfoRow
                                        label="Желаемая площадь"
                                        value={data.desiredArea}
                                    />
                                    <InfoRow
                                        label="Кол-во комнат"
                                        value={data.desiredRooms}
                                    />
                                    <InfoRow
                                        label="Формат оплаты"
                                        value={data.paymentFormat}
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
                                            {data.relatives.map((relative) => (
                                                <div
                                                    key={relative.id}
                                                    className="rounded-xl border border-gray-100 p-3 dark:border-gray-700/60"
                                                >
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        {relative.fullName}
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {relative.phone || '—'}
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                                        {relative.relation}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Родственники не указаны
                                        </p>
                                    )}
                                </SectionCard>

                                <SectionCard title="Объект">
                                    {data.object ? (
                                        fixationObjectFields.map(
                                            ({ key, label }) => (
                                                <InfoRow
                                                    key={key}
                                                    label={label}
                                                    value={formatObjectFieldValue(
                                                        data.object?.[key],
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
                            </Masonry>
                        </div>

                        <div className="flex min-h-0 flex-col gap-4 xl:sticky xl:top-20 xl:col-span-2 xl:self-start">
                            <SectionCard
                                title="История"
                                scrollable
                                className="max-h-[70vh] xl:max-h-none xl:h-[calc(100vh-6.5rem)]"
                                contentClassName="checkboard-scroll pr-1"
                            >
                                {data.history.length === 0 ? (
                                    <p className="py-2 text-sm text-gray-500">
                                        История пуста
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-3 py-1">
                                        {data.history.map((item) => {
                                            const historyStyle =
                                                getFixationHistoryStyle(
                                                    item.type,
                                                )
                                            const historyType =
                                                item.type ?? 'comment'
                                            const HistoryIcon =
                                                fixationHistoryIconMap[
                                                    historyType
                                                ]

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`relative overflow-hidden rounded-xl p-3 pl-4 text-left ${historyStyle.cardClassName}`}
                                                >
                                                    <span
                                                        className={`absolute inset-y-0 left-0 w-1 ${historyStyle.barClassName}`}
                                                        aria-hidden
                                                    />
                                                    <div className="mb-1.5 flex items-center justify-between gap-2">
                                                        <div
                                                            className={`flex items-center gap-2 ${historyStyle.metaClassName}`}
                                                        >
                                                            <HistoryIcon className="text-lg" />
                                                            <span className="text-xs font-medium uppercase tracking-wide">
                                                                {
                                                                    historyStyle.label
                                                                }
                                                            </span>
                                                        </div>
                                                        <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                                            {formatFixationDateTime(
                                                                item.createdAt,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
                                                        {item.title}
                                                    </div>
                                                    {item.description ? (
                                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                            {item.description}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            )
                                        })}
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
