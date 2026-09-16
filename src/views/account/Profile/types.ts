import type { AccessLevel } from '@/@types/auth'

export type GetSettingsProfileResponse = {
    id: string
    fullName: string
    email: string
    img: string
    phone: string
    countryCode: string
    agency: string
    role: string
    accessLevel: AccessLevel | null
}
