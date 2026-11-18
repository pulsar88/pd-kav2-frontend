import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

export type AccessLevelExpiryState = 'none' | 'expired' | 'today' | 'soon' | 'active'

/** Дата действия уровня доступа: «18.11.2026» */
export const formatAccessLevelDate = (value?: string | null): string => {
    if (!value) return ''
    const date = dayjs(value)
    return date.isValid() ? date.format('DD.MM.YYYY') : ''
}

/** Состояние срока действия уровня (по количеству дней до окончания) */
export const getAccessLevelExpiryState = (
    value?: string | null,
): AccessLevelExpiryState => {
    if (!value) return 'none'
    const date = dayjs(value)
    if (!date.isValid()) return 'none'

    const days = date.endOf('day').diff(dayjs().startOf('day'), 'day')
    if (days < 0) return 'expired'
    if (days === 0) return 'today'
    if (days <= 3) return 'soon'
    return 'active'
}

/** Подпись срока действия уровня доступа для таблицы и диалога */
export const getAccessLevelExpiryLabel = (value?: string | null): string => {
    const date = formatAccessLevelDate(value)
    if (!date) return 'Без ограничения срока'

    const state = getAccessLevelExpiryState(value)
    if (state === 'expired') return `Истёк ${date}`
    if (state === 'today') return `Истекает сегодня`
    return `до ${date}`
}

/** Классы цвета для подписи срока действия уровня */
export const getAccessLevelExpiryClassName = (value?: string | null): string => {
    const state = getAccessLevelExpiryState(value)
    if (state === 'expired') return 'text-rose-600 dark:text-rose-400'
    if (state === 'today' || state === 'soon')
        return 'text-amber-600 dark:text-amber-400'
    return 'text-gray-500 dark:text-gray-400'
}
