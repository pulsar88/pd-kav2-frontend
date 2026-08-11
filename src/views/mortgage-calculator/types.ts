export type PaymentType = 'annuity' | 'differentiated'

export type MortgageInput = {
    paymentType: PaymentType
    propertyPrice: number
    downPayment: number
    termYears: number
    annualRate: number
    startMonth: number
    startYear: number
}

export type ScheduleRow = {
    number: number
    date: Date
    payment: number
    principal: number
    interest: number
    balance: number
}

export type MortgageResult = {
    loanAmount: number
    downPayment: number
    termYears: number
    termMonths: number
    annualRate: number
    paymentType: PaymentType
    /** Для аннуитета — фиксированный платёж; для дифференцированного — первый */
    monthlyPayment: number
    /** Для дифференцированного — последний платёж */
    lastMonthlyPayment: number
    totalPayment: number
    overpayment: number
    schedule: ScheduleRow[]
}
