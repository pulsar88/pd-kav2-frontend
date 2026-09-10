import dayjs from 'dayjs'
import 'dayjs/locale/ru'

export const stripHtml = (html: string) =>
    html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()

export const formatOfferDate = (value: string) =>
    dayjs(value).locale('ru').format('D MMM YYYY')

export const formatOfferPeriod = (start: string, end: string) =>
    `${formatOfferDate(start)} — ${formatOfferDate(end)}`
