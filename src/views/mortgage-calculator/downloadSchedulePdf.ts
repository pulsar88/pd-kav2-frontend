import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { MortgageResult } from './types'
import { formatDate, formatMoney } from './utils'

pdfMake.addVirtualFileSystem(pdfFonts)

export const downloadSchedulePdf = (result: MortgageResult) => {
    const paymentTypeLabel =
        result.paymentType === 'annuity' ? 'Аннуитетный' : 'Дифференцированный'

    const docDefinition = {
        pageOrientation: 'landscape' as const,
        pageMargins: [24, 32, 24, 32],
        content: [
            {
                text: 'График платежей по ипотеке',
                style: 'title',
                margin: [0, 0, 0, 16] as [number, number, number, number],
            },
            {
                columns: [
                    {
                        stack: [
                            { text: 'Сумма кредита', style: 'label' },
                            {
                                text: formatMoney(result.loanAmount),
                                style: 'value',
                            },
                        ],
                    },
                    {
                        stack: [
                            { text: 'Процентная ставка', style: 'label' },
                            { text: `${result.annualRate}%`, style: 'value' },
                        ],
                    },
                    {
                        stack: [
                            { text: 'Срок кредита', style: 'label' },
                            {
                                text: `${result.termYears} лет (${result.termMonths} мес.)`,
                                style: 'value',
                            },
                        ],
                    },
                    {
                        stack: [
                            { text: 'Тип платежа', style: 'label' },
                            { text: paymentTypeLabel, style: 'value' },
                        ],
                    },
                ],
                columnGap: 16,
                margin: [0, 0, 0, 20] as [number, number, number, number],
            },
            {
                table: {
                    headerRows: 1,
                    widths: [36, '*', '*', '*', '*', '*'],
                    body: [
                        [
                            { text: '№', style: 'tableHeader' },
                            { text: 'Дата платежа', style: 'tableHeader' },
                            { text: 'Платеж', style: 'tableHeader' },
                            { text: 'Основной долг', style: 'tableHeader' },
                            { text: 'Проценты', style: 'tableHeader' },
                            { text: 'Остаток долга', style: 'tableHeader' },
                        ],
                        ...result.schedule.map((row) => [
                            String(row.number),
                            formatDate(row.date),
                            formatMoney(row.payment),
                            formatMoney(row.principal),
                            formatMoney(row.interest),
                            formatMoney(row.balance),
                        ]),
                    ],
                },
                layout: {
                    fillColor: (rowIndex: number) =>
                        rowIndex === 0 ? '#F3F4F6' : null,
                    hLineColor: () => '#D1D5DB',
                    vLineColor: () => '#D1D5DB',
                },
            },
        ],
        styles: {
            title: {
                fontSize: 16,
                bold: true,
            },
            label: {
                fontSize: 9,
                color: '#6B7280',
                margin: [0, 0, 0, 2] as [number, number, number, number],
            },
            value: {
                fontSize: 11,
                bold: true,
            },
            tableHeader: {
                bold: true,
                fontSize: 9,
            },
        },
        defaultStyle: {
            font: 'Roboto',
            fontSize: 9,
        },
    }

    // Открывает PDF в новой вкладке без диалога печати
    // pdfMake.createPdf(docDefinition).open()
    pdfMake.createPdf(docDefinition).download('grafik-platezhey.pdf')
}
