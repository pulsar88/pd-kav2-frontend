import type { UpdateUserPayload, User } from '@/@types/auth'
import {
    formatRuPhone,
    normalizeRuPhoneDigits,
} from '@/views/fixations/utils'
import type { GetSettingsProfileResponse } from './types'

const roleLabels: Record<string, string> = {
    agent: 'Агент',
}

export const mapUserToProfileForm = (
    user: User,
): GetSettingsProfileResponse => ({
    id: user.userId || '',
    fullName: user.userName || '',
    email: user.email || '',
    phone: user.phone ? formatRuPhone(user.phone) : '',
    countryCode: user.countryCode || 'RU',
    img: user.avatar || '',
    agency: '—',
    role: user.authority?.[0]
        ? roleLabels[user.authority[0]] ?? user.authority[0]
        : '—',
    level: '—',
})

export const mapProfileFormToUpdateUserPayload = (
    values: {
        fullName: string
        email: string
        phone: string
    },
    user: Pick<GetSettingsProfileResponse, 'id' | 'countryCode'>,
): UpdateUserPayload => ({
    id: Number(user.id),
    name: values.fullName,
    email: values.email,
    phone: normalizeRuPhoneDigits(values.phone),
    country_code: user.countryCode,
})
