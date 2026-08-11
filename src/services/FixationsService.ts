import { profileData } from '@/mock/data/accountsData'
import { checkboardByComplexId } from '@/mock/data/checkboardData'
import { fixationsData } from '@/mock/data/fixationsData'
import {
    fixationClientsData,
    fixationComplexesData,
} from '@/mock/data/fixationWizardData'
import type {
    CreateFixationClientPayload,
    CreateFixationPayload,
    FixationClient,
    FixationComplex,
    GetFixationClientsParams,
    GetFixationClientsResponse,
} from '@/views/fixations/createWizard.types'
import type { Fixation, GetFixationsResponse } from '@/views/fixations/types'
import { normalizeRuPhoneDigits } from '@/views/fixations/utils'

const delay = (ms = 200) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms)
    })

const DEFAULT_CLIENTS_PAGE_SIZE = 20

export async function apiGetFixations(): Promise<GetFixationsResponse> {
    await delay()
    return {
        list: [...fixationsData],
        total: fixationsData.length,
    }
}

export async function apiGetFixation(id: string): Promise<Fixation | null> {
    await delay()
    return fixationsData.find((item) => item.id === id) || null
}

export async function apiGetFixationClients(
    params: GetFixationClientsParams = {},
): Promise<GetFixationClientsResponse> {
    await delay()
    const page = Math.max(1, params.page ?? 1)
    const limit = Math.max(1, params.limit ?? DEFAULT_CLIENTS_PAGE_SIZE)
    const query = params.q?.trim() || ''
    const queryLower = query.toLowerCase()
    const queryDigits = normalizeRuPhoneDigits(query)

    const filtered = fixationClientsData.filter((client) => {
        if (!query) return true

        const nameMatch = client.fullName.toLowerCase().includes(queryLower)
        const phoneDigits = normalizeRuPhoneDigits(client.phone)
        const phoneMatch = Boolean(
            queryDigits && phoneDigits.includes(queryDigits),
        )

        return nameMatch || phoneMatch
    })

    const start = (page - 1) * limit

    return {
        list: filtered.slice(start, start + limit),
        total: filtered.length,
    }
}

export async function apiCreateFixationClient(
    data: CreateFixationClientPayload,
): Promise<FixationClient> {
    await delay()
    const fullName = [data.lastName, data.firstName, data.middleName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ')

    const client: FixationClient = {
        id: `c${Date.now()}`,
        fullName,
        phone: data.phone,
    }

    fixationClientsData.unshift(client)
    return client
}

export async function apiGetFixationComplexes(): Promise<FixationComplex[]> {
    await delay()
    return [...fixationComplexesData]
}

export async function apiCreateFixation(
    data: CreateFixationPayload,
): Promise<Fixation> {
    await delay()
    const client = fixationClientsData.find((item) => item.id === data.clientId)
    const complex = fixationComplexesData.find(
        (item) => item.id === data.complexId,
    )
    const apartment = complex?.apartments.find(
        (item) => item.id === data.apartmentId,
    )
    const checkboardApartment =
        !apartment && data.apartmentId
            ? Object.values(
                  checkboardByComplexId[data.complexId]?.sections ?? [],
              )
                  .flatMap((section) =>
                      Array.isArray(section.properties)
                          ? section.properties
                          : Object.values(section.properties).flat(),
                  )
                  .find((item) => String(item.id) === data.apartmentId)
            : null
    const now = new Date()
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + 1)

    const manager = data.managerId
        ? complex?.managers.find((item) => item.id === data.managerId)
        : undefined
    const relatives = (data.relatives || [])
        .map((relative) => {
            const client = fixationClientsData.find(
                (item) => item.id === relative.clientId,
            )
            if (!client || client.id === data.clientId || !relative.relation) {
                return null
            }

            return {
                id: client.id,
                fullName: client.fullName,
                phone: client.phone,
                relation: relative.relation,
            }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))

    const fixation: Fixation = {
        id: String(Date.now()),
        fullName: client?.fullName || 'Клиент',
        phone: client?.phone || '—',
        status: 'fixed',
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        objectName: complex?.address || '—',
        projectName: complex?.name || '—',
        objectId:
            apartment?.id ||
            (checkboardApartment ? String(checkboardApartment.id) : null) ||
            complex?.id ||
            '—',
        apartment:
            apartment || checkboardApartment
                ? `кв. ${apartment?.number || checkboardApartment?.number}`
                : undefined,
        address: complex?.address,
        managerName: manager?.fullName,
        managerPhone: manager?.phone,
        managerPhoto: manager?.photo,
        note: data.note,
        desiredArea: data.desiredArea,
        desiredRooms: data.desiredRooms,
        paymentFormat: data.paymentFormat,
        budget: data.budget,
        meetingDate: data.meetingDate,
        relatives: relatives.length > 0 ? relatives : undefined,
        agent: {
            email: profileData.email,
            fullName: profileData.fullName,
            phone: profileData.phone,
            agency: profileData.agency,
        },
        crm: {
            leadCreated: false,
            leadExternalId: null,
        },
        history: [
            {
                id: `h-${Date.now()}`,
                type: 'created',
                title: 'Фиксация создана',
                description: data.note || undefined,
                createdAt: now.toISOString(),
            },
        ],
    }

    fixationsData.unshift(fixation)
    return fixation
}
