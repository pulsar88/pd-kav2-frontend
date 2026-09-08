import { useMemo, useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Segment from '@/components/ui/Segment'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import {
    HEADER_HEIGHT,
    PAGE_CONTAINER_GUTTER_X,
} from '@/constants/theme.constant'
import classNames from '@/utils/classNames'
import {
    calculateMortgage,
    formatDate,
    formatMoney,
    MONTH_OPTIONS,
} from './utils'
import { downloadSchedulePdf } from './downloadSchedulePdf'
import type { MortgageResult, PaymentType } from './types'
import Tooltip from '@/components/ui/Tooltip'
import { useNavigate } from 'react-router'
import {
    TbArrowNarrowLeft,
    TbCalculator,
    TbCalendarStats,
    TbCash,
    TbCoin,
    TbInfoCircle,
    TbPercentage,
    TbPigMoney,
    TbPrinter,
    TbTable,
    TbWallet,
} from 'react-icons/tb'
import type { ReactNode } from 'react'

const { THead, TBody, Tr, Th, Td } = Table

type MonthOption = { value: number; label: string }
type YearOption = { value: number; label: string }

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const SCROLL_OFFSET = HEADER_HEIGHT + 16
const SCHEDULE_PAGE_SIZE = 12

const yearOptions: YearOption[] = Array.from({ length: 31 }, (_, i) => {
    const year = currentYear + i
    return { value: year, label: String(year) }
})

const parseNumber = (raw: string) => {
    const normalized = raw.replace(/\s/g, '').replace(',', '.')
    const value = Number(normalized)
    return Number.isFinite(value) ? value : NaN
}

type DetailItemProps = {
    icon: ReactNode
    label: string
    value: string
    accent?: 'primary' | 'warning' | 'success' | 'neutral'
}

const accentStyles = {
    primary: 'bg-primary/10 text-primary dark:bg-primary/20',
    warning:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    success:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
}

const DetailItem = ({
    icon,
    label,
    value,
    accent = 'neutral',
}: DetailItemProps) => (
    <div className="flex min-w-0 items-start gap-3 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-800/60">
        <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${accentStyles[accent]}`}
        >
            {icon}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
            <div className="mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
            </div>
            <div className="heading-text text-sm font-bold leading-snug break-all sm:text-base">
                {value}
            </div>
        </div>
    </div>
)

const MortgageCalculator = () => {
    const navigate = useNavigate()
    const [paymentType, setPaymentType] = useState<PaymentType>('annuity')
    const [propertyPrice, setPropertyPrice] = useState('8 000 000')
    const [downPayment, setDownPayment] = useState('1 600 000')
    const [termYears, setTermYears] = useState('20')
    const [annualRate, setAnnualRate] = useState('18')
    const [startMonth, setStartMonth] = useState(currentMonth)
    const [startYear, setStartYear] = useState(currentYear)
    const [error, setError] = useState('')
    const [result, setResult] = useState<MortgageResult | null>(null)
    const [schedulePage, setSchedulePage] = useState(1)

    const scheduleRef = useRef<HTMLDivElement>(null)

    const selectedMonth = useMemo(
        () => MONTH_OPTIONS.find((m) => m.value === startMonth) || null,
        [startMonth],
    )
    const selectedYear = useMemo(
        () => yearOptions.find((y) => y.value === startYear) || null,
        [startYear],
    )

    const pagedSchedule = useMemo(() => {
        if (!result) return []
        const start = (schedulePage - 1) * SCHEDULE_PAGE_SIZE
        return result.schedule.slice(start, start + SCHEDULE_PAGE_SIZE)
    }, [result, schedulePage])

    const handleCalculate = (nextPaymentType: PaymentType = paymentType) => {
        const price = parseNumber(propertyPrice)
        const down = parseNumber(downPayment)
        const years = parseNumber(termYears)
        const rate = parseNumber(annualRate)

        if (!Number.isFinite(price) || price <= 0) {
            setError('Укажите стоимость недвижимости')
            return
        }
        if (!Number.isFinite(down) || down < 0) {
            setError('Укажите первоначальный взнос')
            return
        }
        if (down >= price) {
            setError('Первоначальный взнос должен быть меньше стоимости')
            return
        }
        if (!Number.isFinite(years) || years <= 0 || years > 50) {
            setError('Укажите срок ипотеки от 1 до 50 лет')
            return
        }
        if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
            setError('Укажите процентную ставку от 0 до 100')
            return
        }

        const next = calculateMortgage({
            paymentType: nextPaymentType,
            propertyPrice: price,
            downPayment: down,
            termYears: years,
            annualRate: rate,
            startMonth,
            startYear,
        })

        if (!next) {
            setError('Не удалось рассчитать ипотеку. Проверьте данные.')
            setResult(null)
            setSchedulePage(1)
            return
        }

        setError('')
        setResult(next)
        setSchedulePage(1)
    }

    const handlePaymentTypeChange = (value: string | string[]) => {
        const nextType = value as PaymentType
        setPaymentType(nextType)
        if (result) {
            handleCalculate(nextType)
        }
    }

    const scrollToSchedule = () => {
        const el = scheduleRef.current
        if (!el) return

        const top =
            el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET

        window.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth',
        })
    }

    return (
        <div
            className={classNames(
                'min-w-0 w-full overflow-x-hidden py-6',
                PAGE_CONTAINER_GUTTER_X,
            )}
        >
            <Card
                className="w-full"
                header={{
                    bordered: true,
                    content: (
                        <div>
                            <button
                                type="button"
                                className="mb-4 inline-flex items-center gap-3 text-gray-800 outline-hidden transition-colors hover:text-primary dark:text-gray-100 dark:hover:text-primary"
                                onClick={() => navigate('/tools')}
                            >
                                <span className="rounded-full bg-gray-100 p-2 text-xl transition-colors hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/20">
                                    <TbArrowNarrowLeft />
                                </span>
                                <span className="text-sm font-semibold">
                                    Назад
                                </span>
                            </button>
                            <h3 className="mb-1">Ипотечный калькулятор</h3>
                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                Рассчитайте ежемесячный платёж и график выплат
                                по ипотеке
                            </p>
                        </div>
                    ),
                }}
            >
            <div className="grid min-w-0 gap-6 min-[1200px]:grid-cols-2">
                <Card className="min-w-0" bodyClass="p-5">
                    <FormItem label="Тип платежа">
                        <Segment
                            className="!flex w-full max-w-full flex-col gap-1 sm:flex-row sm:flex-wrap"
                            value={paymentType}
                            onChange={handlePaymentTypeChange}
                        >
                            <Segment.Item
                                value="annuity"
                                className="w-full !px-3 !text-sm sm:w-auto sm:flex-1 sm:!px-5"
                            >
                                <span className="inline-flex items-center justify-center gap-1.5">
                                    Аннуитетный
                                    <Tooltip
                                        title="Равные платежи на весь срок: сумма каждый месяц одинаковая"
                                        wrapperClass="inline-flex"
                                    >
                                        <span
                                            className="inline-flex text-base opacity-70"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <TbInfoCircle />
                                        </span>
                                    </Tooltip>
                                </span>
                            </Segment.Item>
                            <Segment.Item
                                value="differentiated"
                                className="w-full !px-3 !text-sm sm:w-auto sm:flex-1 sm:!px-5"
                            >
                                <span className="inline-flex items-center justify-center gap-1.5">
                                    Дифференцированный
                                    <Tooltip
                                        title="Платежи уменьшаются: долг гасится равными частями, проценты — от остатка"
                                        wrapperClass="inline-flex"
                                    >
                                        <span
                                            className="inline-flex text-base opacity-70"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <TbInfoCircle />
                                        </span>
                                    </Tooltip>
                                </span>
                            </Segment.Item>
                        </Segment>
                    </FormItem>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormItem label="Стоимость недвижимости, ₽">
                            <Input
                                value={propertyPrice}
                                placeholder="8 000 000"
                                onChange={(e) =>
                                    setPropertyPrice(e.target.value)
                                }
                            />
                        </FormItem>
                        <FormItem label="Первоначальный взнос, ₽">
                            <Input
                                value={downPayment}
                                placeholder="1 600 000"
                                onChange={(e) =>
                                    setDownPayment(e.target.value)
                                }
                            />
                        </FormItem>
                        <FormItem label="Срок ипотеки, лет">
                            <Input
                                value={termYears}
                                placeholder="20"
                                onChange={(e) => setTermYears(e.target.value)}
                            />
                        </FormItem>
                        <FormItem label="Процентная ставка, %">
                            <Input
                                value={annualRate}
                                placeholder="18"
                                onChange={(e) => setAnnualRate(e.target.value)}
                            />
                        </FormItem>
                        <FormItem label="Начало выплат — месяц">
                            <Select<MonthOption>
                                options={MONTH_OPTIONS}
                                value={selectedMonth}
                                onChange={(option) => {
                                    if (option) setStartMonth(option.value)
                                }}
                            />
                        </FormItem>
                        <FormItem label="Начало выплат — год">
                            <Select<YearOption>
                                options={yearOptions}
                                value={selectedYear}
                                onChange={(option) => {
                                    if (option) setStartYear(option.value)
                                }}
                            />
                        </FormItem>
                    </div>

                    {error ? (
                        <p className="mb-4 text-sm text-error">{error}</p>
                    ) : null}

                    <Button
                        className="mt-6"
                        variant="solid"
                        icon={<TbCalculator />}
                        onClick={() => handleCalculate()}
                    >
                        Рассчитать ипотеку
                    </Button>
                </Card>

                <Card className="min-w-0" bodyClass="flex h-full flex-col p-5">
                    {result ? (
                        <div className="flex h-full min-w-0 flex-col gap-5">
                            <div className="border-b border-gray-200 pb-5 dark:border-gray-700">
                                <div className="mb-3 flex items-start gap-3">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                                        <TbWallet />
                                    </span>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <div className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Ежемесячный платёж
                                        </div>
                                        {result.paymentType === 'annuity' ? (
                                            <div className="heading-text text-2xl font-bold tracking-tight break-all sm:text-3xl lg:text-4xl">
                                                {formatMoney(
                                                    result.monthlyPayment,
                                                )}
                                            </div>
                                        ) : (
                                            <div className="heading-text text-xl font-bold tracking-tight break-words sm:text-2xl lg:text-3xl">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    от{' '}
                                                </span>
                                                {formatMoney(
                                                    Math.min(
                                                        result.monthlyPayment,
                                                        result.lastMonthlyPayment,
                                                    ),
                                                )}
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {' '}
                                                    до{' '}
                                                </span>
                                                {formatMoney(
                                                    Math.max(
                                                        result.monthlyPayment,
                                                        result.lastMonthlyPayment,
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    className="mt-4"
                                    variant="solid"
                                    icon={<TbTable />}
                                    onClick={scrollToSchedule}
                                >
                                    График платежей
                                </Button>
                            </div>

                            <div className="min-w-0">
                                <h5 className="mb-3">Детали расчёта</h5>
                                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                                    <DetailItem
                                        icon={<TbCash />}
                                        label="Общая сумма выплат"
                                        value={formatMoney(result.totalPayment)}
                                        accent="primary"
                                    />
                                    <DetailItem
                                        icon={<TbPercentage />}
                                        label="Переплата по кредиту"
                                        value={formatMoney(result.overpayment)}
                                        accent="warning"
                                    />
                                    <DetailItem
                                        icon={<TbPigMoney />}
                                        label="Первоначальный взнос"
                                        value={formatMoney(result.downPayment)}
                                        accent="success"
                                    />
                                    <DetailItem
                                        icon={<TbCalendarStats />}
                                        label="Срок кредита"
                                        value={`${result.termYears} лет (${result.termMonths} мес.)`}
                                        accent="neutral"
                                    />
                                    <DetailItem
                                        icon={<TbCoin />}
                                        label="Сумма кредита"
                                        value={formatMoney(result.loanAmount)}
                                        accent="primary"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-4 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-400 dark:bg-gray-700 dark:text-gray-300">
                                <TbCalculator />
                            </div>
                            <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                                Заполните параметры слева и нажмите «Рассчитать
                                ипотеку»
                            </p>
                        </div>
                    )}
                </Card>
            </div>

            {result ? (
                <Card
                    ref={scheduleRef}
                    className="mt-6"
                    bodyClass="p-5"
                    id="mortgage-schedule"
                    style={{ scrollMarginTop: SCROLL_OFFSET }}
                >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h5>График платежей</h5>
                        <Button
                            variant="solid"
                            icon={<TbPrinter />}
                            onClick={() => downloadSchedulePdf(result)}
                        >
                            Распечатать график в PDF
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <Tr>
                                    <Th>№</Th>
                                    <Th>Дата платежа</Th>
                                    <Th>Платеж</Th>
                                    <Th>Основной долг</Th>
                                    <Th>Проценты</Th>
                                    <Th>Остаток долга</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {pagedSchedule.map((row) => (
                                    <Tr key={row.number}>
                                        <Td>{row.number}</Td>
                                        <Td className="capitalize">
                                            {formatDate(row.date)}
                                        </Td>
                                        <Td>{formatMoney(row.payment)}</Td>
                                        <Td className="font-medium text-emerald-600 dark:text-emerald-400">
                                            {formatMoney(row.principal)}
                                        </Td>
                                        <Td className="font-medium text-orange-500 dark:text-orange-400">
                                            {formatMoney(row.interest)}
                                        </Td>
                                        <Td>{formatMoney(row.balance)}</Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Показано {pagedSchedule.length} из{' '}
                            {result.schedule.length} платежей
                        </div>
                        <Pagination
                            className="justify-start sm:justify-end"
                            currentPage={schedulePage}
                            pageSize={SCHEDULE_PAGE_SIZE}
                            total={result.schedule.length}
                            pagerCount={3}
                            onChange={setSchedulePage}
                        />
                    </div>
                </Card>
            ) : null}
            </Card>
        </div>
    )
}

export default MortgageCalculator
