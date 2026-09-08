import type {
    CreateFixationApiBody,
    FixationCreateClientApi,
    FixationCreateManagerApi,
} from './fixationCreateApi.types'
import type {
    CreateFixationWizardPayload,
    FixationClient,
    FixationManager,
} from './createWizard.types'
import {
    formatFixationPhone,
    serializeRuPhoneForApi,
} from './utils'

export const mapFixationCreateClientApiToClient = (
    item: FixationCreateClientApi,
): FixationClient => {
    const fullName = [item.second_name, item.name, item.last_name]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ')

    return {
        id: String(item.id),
        fullName: fullName || '—',
        phone: formatFixationPhone(item.phones?.[0]?.phone),
        countryCode: item.phones?.[0]?.country_code?.trim() || 'RU',
    }
}

export const mapFixationCreateManagerApiToManager = (
    item: FixationCreateManagerApi,
): FixationManager => ({
    id: String(item.id),
    fullName: item.name,
})

export const mapCreateFixationPayloadToApiBody = (
    payload: CreateFixationWizardPayload,
): CreateFixationApiBody => {
    const body: CreateFixationApiBody = {
        object_id: payload.objectId,
    }

    if (payload.managerId != null) {
        body.manager_id = payload.managerId
    }

    if (payload.client?.isNew) {
        body.client = {
            name: payload.client.firstName?.trim() || payload.client.fullName,
            second_name: payload.client.lastName?.trim() || undefined,
            last_name: payload.client.secondName?.trim() || undefined,
            phones: [{
                phone: serializeRuPhoneForApi(payload.client.phone),
                country_code: payload.client.countryCode || 'RU',
            }]
        }
    } else if (payload.clientId != null) {
        body.client_id = payload.clientId
    }

    // TODO(api): раскомментировать, когда POST /v2/fixations начнёт принимать поля
    // if (payload.propertyId != null) {
    //     body.property_id = payload.propertyId
    // }
    if (payload.note?.trim()) {
        body.comment = payload.note.trim()
    }
    if (payload.desiredArea) {
        body.preferred_area = payload.desiredArea
    }
    if (payload.desiredRooms) {
        body.preferred_rooms_count = payload.desiredRooms
    }
    if (payload.paymentFormat) {
        body.preferred_payment = payload.paymentFormat
    }
    if (payload.budget?.trim()) {
        body.budget = payload.budget.trim()
    }
    if (payload.meetingDate) {
        body.meeting_date = payload.meetingDate
    }
    // if (payload.relatives?.length) {
    //     body.relatives = payload.relatives.map((relative) => ({
    //         client_id: Number(relative.clientId),
    //         relation: relative.relation,
    //     }))
    // }

    return body
}
