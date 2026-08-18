import type {
    FixationApiClient,
    FixationApiItem,
} from './fixationApi.types'
import type { Fixation, FixationStatus } from './types'
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

    const fullName = [client.last_name, client.name, client.second_name]
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

export const mapFixationApiItemToFixation = (
    item: FixationApiItem,
): Fixation => {
    const object = item.object

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
        agent: {
            email: item.agent?.email?.trim() || '—',
            fullName: item.agent?.name?.trim() || '—',
            phone: formatFixationPhone(item.agent?.phone),
            agency: item.agency?.name?.trim() || '—',
        },
        crm: mapCrmStatus(item.crm_status),
        history: [],
    }
}
