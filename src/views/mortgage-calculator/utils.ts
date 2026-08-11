import type { MortgageInput, MortgageResult, ScheduleRow } from './types'

const roundMoney = (value: number) => Math.round(value * 100) / 100

const addMonths = (year: number, month: number, offset: number) => {
    const total = year * 12 + (month - 1) + offset
    return {
        year: Math.floor(total / 12),
        month: (total % 12) + 1,
    }
}

export const calculateMortgage = (
    input: MortgageInput,
): MortgageResult | null => {
    const {
        paymentType,
        propertyPrice,
        downPayment,
        termYears,
        annualRate,
        startMonth,
        startYear,
    } = input

    if (
        !Number.isFinite(propertyPrice) ||
        !Number.isFinite(downPayment) ||
        !Number.isFinite(termYears) ||
        !Number.isFinite(annualRate) ||
        propertyPrice <= 0 ||
        downPayment < 0 ||
        downPayment >= propertyPrice ||
        termYears <= 0 ||
        annualRate < 0 ||
        startMonth < 1 ||
        startMonth > 12 ||
        startYear < 1970
    ) {
        return null
    }

    const loanAmount = roundMoney(propertyPrice - downPayment)
    const termMonths = Math.round(termYears * 12)
    if (loanAmount <= 0 || termMonths <= 0) return null

    const monthlyRate = annualRate / 100 / 12
    const schedule: ScheduleRow[] = []
    let balance = loanAmount
    let totalPayment = 0

    if (paymentType === 'annuity') {
        const annuityPayment =
            monthlyRate === 0
                ? loanAmount / termMonths
                : (loanAmount *
                      (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
                  (Math.pow(1 + monthlyRate, termMonths) - 1)

        const fixedPayment = roundMoney(annuityPayment)

        for (let i = 0; i < termMonths; i += 1) {
            const interest = roundMoney(balance * monthlyRate)
            let principal = roundMoney(fixedPayment - interest)
            let payment = fixedPayment

            if (i === termMonths - 1) {
                principal = roundMoney(balance)
                payment = roundMoney(principal + interest)
            }

            balance = roundMoney(Math.max(0, balance - principal))
            totalPayment += payment

            const { year, month } = addMonths(startYear, startMonth, i)
            schedule.push({
                number: i + 1,
                date: new Date(year, month - 1, 1),
                payment,
                principal,
                interest,
                balance,
            })
        }
    } else {
        const principalPart = roundMoney(loanAmount / termMonths)

        for (let i = 0; i < termMonths; i += 1) {
            const interest = roundMoney(balance * monthlyRate)
            let principal = principalPart

            if (i === termMonths - 1) {
                principal = roundMoney(balance)
            }

            const payment = roundMoney(principal + interest)
            balance = roundMoney(Math.max(0, balance - principal))
            totalPayment += payment

            const { year, month } = addMonths(startYear, startMonth, i)
            schedule.push({
                number: i + 1,
                date: new Date(year, month - 1, 1),
                payment,
                principal,
                interest,
                balance,
            })
        }
    }

    totalPayment = roundMoney(totalPayment)
    const overpayment = roundMoney(totalPayment - loanAmount)
    const monthlyPayment = schedule[0]?.payment ?? 0
    const lastMonthlyPayment = schedule[schedule.length - 1]?.payment ?? 0

    return {
        loanAmount,
        downPayment: roundMoney(downPayment),
        termYears,
        termMonths,
        annualRate,
        paymentType,
        monthlyPayment,
        lastMonthlyPayment,
        totalPayment,
        overpayment,
        schedule,
    }
}

export const formatMoney = (value: number) =>
    `${new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)} ₽`

export const formatDate = (date: Date) =>
    date.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
    })

export const MONTH_OPTIONS = [
    { value: 1, label: 'Январь' },
    { value: 2, label: 'Февраль' },
    { value: 3, label: 'Март' },
    { value: 4, label: 'Апрель' },
    { value: 5, label: 'Май' },
    { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' },
    { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябрь' },
    { value: 10, label: 'Октябрь' },
    { value: 11, label: 'Ноябрь' },
    { value: 12, label: 'Декабрь' },
]
