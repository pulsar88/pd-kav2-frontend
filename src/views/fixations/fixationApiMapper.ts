import type {
    FixationApiAdditionalClient,
    FixationApiClient,
    FixationApiItem,
    FixationApiPreferenceOption,
} from './fixationApi.types'
import type { Fixation, FixationRelative, FixationStatus } from './types'
import { formatFixationPhone } from './utils'

const resolveApiStatus = (item: FixationApiItem): FixationStatus => {
    const status = item.status

    if (status?.value) {
        return status.value
    }

    if (status?.code) {
        return status.code.toLowerCase() as FixationStatus
    }

    return 'pending'
}

const resolveClientName = (client?: FixationApiClient) => {
    if (!client) {
        return '—'
    }

    const fullName = [client.second_name, client.name, client.last_name]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ')

    return fullName || '—'
}

const resolveFixedTill = (fixedTill?: string) => fixedTill?.trim() || ''

const mapCrmStatus = (crmStatus?: FixationApiItem['crm_status']) => ({
    leadCreated: Boolean(
        crmStatus?.lead_created ??
            crmStatus?.lead_external_id ??
            crmStatus?.external_id,
    ),
    leadExternalId:
        crmStatus?.lead_external_id ?? crmStatus?.external_id ?? null,
})

const resolveClientPhone = (client?: FixationApiClient) =>
    formatFixationPhone(client?.phones?.[0]?.phone)

const resolveManagerPhone = (item: FixationApiItem) => {
    const raw =
        item.manager?.phone?.trim() || item.agent?.phone?.trim() || undefined

    if (!raw) {
        return undefined
    }

    return formatFixationPhone(raw)
}

const resolvePreferenceLabel = (
    option?: FixationApiPreferenceOption | null,
) => {
    const name = option?.name?.trim()
    if (name) return name

    const code = option?.code?.trim()
    if (code) return code

    if (option?.value != null && option.value !== '') {
        return String(option.value)
    }

    return undefined
}

const formatBudget = (budget?: number | string | null) => {
    if (budget == null || budget === '') return undefined

    const numeric = typeof budget === 'number' ? budget : Number(String(budget).replace(/\s/g, ''))
    if (!Number.isFinite(numeric)) {
        return String(budget)
    }

    return new Intl.NumberFormat('ru-RU').format(numeric)
}

const resolveRelationLabel = (client: FixationApiAdditionalClient) => {
    const option = client.relation?.relation
    if (!option) return '—'

    const name = option.name?.trim()
    if (name) return name

    const code = option.code?.trim()
    if (code) return code

    if (option.value != null && option.value !== '') {
        return String(option.value)
    }

    return '—'
}

const mapAdditionalClients = (
    item: FixationApiItem,
): FixationRelative[] | undefined => {
    const clients = item.additional_clients ?? item.additionalClients
    if (!clients?.length) return undefined

    return clients.map((client) => ({
        id: String(client.id),
        fullName: resolveClientName(client),
        phone: resolveClientPhone(client),
        relation: resolveRelationLabel(client),
    }))
}

export const unwrapFixationApiResponse = (
    response: FixationApiItem | { data?: FixationApiItem | null },
): FixationApiItem | null => {
    if (!response || typeof response !== 'object') {
        return null
    }

    if ('data' in response) {
        return response.data ?? null
    }

    if ('id' in response) {
        return response
    }

    return null
}

const resolveHasExtendRequest = (item: FixationApiItem): boolean => {
    const raw = item as Record<string, unknown>
    if (
        raw.has_extend_request === true ||
        raw.has_extend_request === 1 ||
        raw.has_extend_request === '1'
    ) {
        return true
    }
    if (
        raw.hasExtendRequest === true ||
        raw.hasExtendRequest === 1 ||
        raw.hasExtendRequest === '1'
    ) {
        return true
    }
    if (Array.isArray(raw.extend_requests) && raw.extend_requests.length > 0) {
        return true
    }
    if (Array.isArray(raw.extendRequests) && raw.extendRequests.length > 0) {
        return true
    }
    return false
}

export const mapFixationApiItemToFixation = (
    item: FixationApiItem,
): Fixation => {
    const object = item.object
    const note = item.comment?.trim() || undefined
    const budget = formatBudget(item.budget)
    const meetingDate = item.meeting_date?.trim() || undefined
    const hasExtend = resolveHasExtendRequest(item)

    return {
        id: String(item.id),
        fullName: resolveClientName(item.client),
        phone: resolveClientPhone(item.client),
        status: resolveApiStatus(item),
        statusLabel: item.status?.name,
        createdAt: item.created_at,
        expiresAt: resolveFixedTill(item.fixed_till),
        objectName: object?.address?.trim() || object?.name?.trim() || '—',
        projectName: object?.name?.trim() || '—',
        objectId: object?.id != null ? String(object.id) : '—',
        object: object ?? undefined,
        address: object?.address?.trim() || undefined,
        managerName: item.manager?.name?.trim(),
        managerPhone: resolveManagerPhone(item),
        note,
        desiredArea: resolvePreferenceLabel(item.preferred_area),
        desiredRooms: resolvePreferenceLabel(item.preferred_rooms_count),
        paymentFormat: resolvePreferenceLabel(item.preferred_payment),
        budget,
        meetingDate,
        relatives: mapAdditionalClients(item),
        agent: {
            email: item.agent?.email?.trim() || '—',
            fullName: item.agent?.name?.trim() || '—',
            phone: formatFixationPhone(item.agent?.phone),
            agency: item.agency?.name?.trim() || '—',
        },
        crm: mapCrmStatus(item.crm_status),
        history: [],
        has_extend_request: hasExtend,
        hasExtendRequest: hasExtend,
    }
}
