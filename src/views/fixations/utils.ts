import type { Fixation, FixationHistoryType, FixationStatus } from './types'

export const fixationKinshipOptions = [
    { value: 'spouse', label: 'Супруг / супруга' },
    { value: 'child', label: 'Сын / дочь' },
    { value: 'parent', label: 'Отец / мать' },
    { value: 'sibling', label: 'Брат / сестра' },
    { value: 'grandparent', label: 'Дедушка / бабушка' },
    { value: 'grandchild', label: 'Внук / внучка' },
    { value: 'other', label: 'Иной родственник' },
] as const

export const fixationKinshipLabel: Record<string, string> = Object.fromEntries(
    fixationKinshipOptions.map((item) => [item.value, item.label]),
)

export const formatFixationKinship = (value?: string) =>
    (value && fixationKinshipLabel[value]) || value || '—'

export const fixationStatusMap: Record<
    FixationStatus,
    { label: string; className: string }
> = {
    pending: {
        label: 'В ожидании',
        className:
            'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    },
    denied: {
        label: 'Отклонена',
        className:
            'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    },
    fixed: {
        label: 'Фиксирована',
        className:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    },
    registration: {
        label: 'Оформление',
        className:
            'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    },
    success: {
        label: 'Успешно',
        className:
            'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
    },
    failed: {
        label: 'Не реализована',
        className:
            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    },
    deleted: {
        label: 'Удалена',
        className:
            'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300',
    },
}

export const getFixationStatusDisplay = (
    fixation: Pick<Fixation, 'status' | 'statusLabel'>,
) => {
    const meta = fixationStatusMap[fixation.status]

    if (!meta) {
        return {
            label: fixation.statusLabel ?? fixation.status,
            className:
                'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300',
        }
    }

    return {
        label: fixation.statusLabel ?? meta.label,
        className: meta.className,
    }
}

export const fixationHistoryTypeMap: Record<
    FixationHistoryType,
    {
        label: string
        cardClassName: string
        barClassName: string
        metaClassName: string
    }
> = {
    created: {
        label: 'Создание',
        cardClassName: 'bg-emerald-50 dark:bg-emerald-500/10',
        barClassName: 'bg-emerald-500',
        metaClassName: 'text-emerald-600 dark:text-emerald-400',
    },
    status_changed: {
        label: 'Статус',
        cardClassName: 'bg-amber-50 dark:bg-amber-500/10',
        barClassName: 'bg-amber-500',
        metaClassName: 'text-amber-600 dark:text-amber-400',
    },
    crm: {
        label: 'CRM',
        cardClassName: 'bg-blue-50 dark:bg-blue-500/10',
        barClassName: 'bg-blue-500',
        metaClassName: 'text-blue-600 dark:text-blue-400',
    },
    expired: {
        label: 'Истечение',
        cardClassName: 'bg-orange-50 dark:bg-orange-500/10',
        barClassName: 'bg-orange-500',
        metaClassName: 'text-orange-600 dark:text-orange-400',
    },
    rejected: {
        label: 'Отклонение',
        cardClassName: 'bg-rose-50 dark:bg-rose-500/10',
        barClassName: 'bg-rose-500',
        metaClassName: 'text-rose-600 dark:text-rose-400',
    },
    deleted: {
        label: 'Удаление',
        cardClassName: 'bg-gray-100 dark:bg-gray-500/10',
        barClassName: 'bg-gray-400',
        metaClassName: 'text-gray-600 dark:text-gray-400',
    },
    comment: {
        label: 'Комментарий',
        cardClassName: 'bg-violet-50 dark:bg-violet-500/10',
        barClassName: 'bg-violet-500',
        metaClassName: 'text-violet-600 dark:text-violet-400',
    },
    meeting: {
        label: 'Встреча',
        cardClassName: 'bg-sky-50 dark:bg-sky-500/10',
        barClassName: 'bg-sky-500',
        metaClassName: 'text-sky-600 dark:text-sky-400',
    },
    extended: {
        label: 'Продление',
        cardClassName: 'bg-teal-50 dark:bg-teal-500/10',
        barClassName: 'bg-teal-500',
        metaClassName: 'text-teal-600 dark:text-teal-400',
    },
    object_changed: {
        label: 'Объект',
        cardClassName: 'bg-indigo-50 dark:bg-indigo-500/10',
        barClassName: 'bg-indigo-500',
        metaClassName: 'text-indigo-600 dark:text-indigo-400',
    },
}

export const getFixationHistoryStyle = (type?: FixationHistoryType) =>
    fixationHistoryTypeMap[type ?? 'comment']

export const formatFixationDate = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export const formatFixationDateTime = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'

    const datePart = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
    const timePart = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return `${datePart}, ${timePart}`
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

const getCalendarDaysUntilExpiry = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    const now = new Date()
    const expiryDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    )
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return Math.round((expiryDay.getTime() - today.getTime()) / MS_PER_DAY)
}

export const getFixationExpiryAccentClass = (value: string) => {
    const daysLeft = getCalendarDaysUntilExpiry(value)
    if (daysLeft === null) return ''

    // Истекла или истекает сегодня
    if (daysLeft <= 0) {
        return 'text-red-600 dark:text-red-400 font-semibold'
    }

    // 1 день до конца
    if (daysLeft === 1) {
        return 'text-orange-700 dark:text-orange-400 font-semibold'
    }

    // 2 дня до конца
    if (daysLeft === 2) {
        return 'text-orange-500 dark:text-orange-300 font-semibold'
    }

    // 3 дня до конца
    if (daysLeft === 3) {
        return 'text-yellow-500 dark:text-yellow-300 font-semibold'
    }

    return ''
}

export const normalizeRuPhoneDigits = (input: string) => {
    let digits = input.replace(/\D/g, '')
    const hasCountryPrefix =
        /^\s*\+?7/.test(input) ||
        /^\s*8/.test(input) ||
        digits.length >= 11

    if (
        hasCountryPrefix &&
        (digits.startsWith('7') || digits.startsWith('8'))
    ) {
        digits = digits.slice(1)
    }

    digits = digits.slice(0, 10)

    if (digits.length > 0 && digits[0] !== '9') {
        return ''
    }

    return digits
}

export const formatRuPhone = (input: string) => {
    const digits = normalizeRuPhoneDigits(input)
    if (!digits) return ''

    const parts = [
        digits.slice(0, 3),
        digits.slice(3, 6),
        digits.slice(6, 8),
        digits.slice(8, 10),
    ].filter((part) => part.length > 0)

    return `+7 ${parts.join(' ')}`
}

export const formatFixationPhone = (value?: string | null) => {
    const trimmed = value?.trim()
    if (!trimmed || trimmed === '—') {
        return '—'
    }

    return formatRuPhone(trimmed) || trimmed
}

export const serializeRuPhoneForApi = (input: string) => {
    const digits = normalizeRuPhoneDigits(input)
    if (!digits) {
        return input.replace(/\s/g, '')
    }

    return `+7${digits}`
}

export const RU_PHONE_REGEX = /^\+7 9\d{2} \d{3} \d{2} \d{2}$/
