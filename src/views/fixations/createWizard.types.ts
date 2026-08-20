export type FixationClient = {
    id: string
    fullName: string
    phone: string
    countryCode?: string
    isNew?: boolean
    firstName?: string
    secondName?: string
    lastName?: string
}

export type GetFixationClientsParams = {
    q?: string
    page?: number
    page_size?: number
}

export type GetFixationClientsResponse = {
    list: FixationClient[]
    total: number
}

export type FixationManager = {
    id: string
    fullName: string
    phone?: string
    photo?: string
}

export type FixationApartment = {
    id: string
    number: string
    rooms?: number
}

export type FixationComplex = {
    id: string
    name: string
    address: string
    apartments: FixationApartment[]
    managers: FixationManager[]
}

export type CreateFixationRelativePayload = {
    clientId: string
    relation: string
}

/** Базовый payload — совпадает с текущим POST /v2/fixations */
export type CreateFixationPayload = {
    objectId: number
    managerId: number
    clientId?: number
    client?: FixationClient
}

/**
 * Расширенные поля wizard — пока не отправляются в API.
 * Когда бэкенд добавит поддержку, раскомментировать маппинг в
 * mapCreateFixationPayloadToApiBody и включить WIZARD_EXTENDED_FIELDS_ENABLED.
 */
export type CreateFixationExtendedPayload = {
    apartmentId?: string
    propertyId?: number
    relatives?: CreateFixationRelativePayload[]
    note?: string
    desiredArea?: string
    desiredRooms?: string
    paymentFormat?: string
    budget?: string
    meetingDate?: string
}

export type CreateFixationWizardPayload = CreateFixationPayload &
    Partial<CreateFixationExtendedPayload>

export type CreateFixationClientPayload = {
    lastName: string
    firstName: string
    middleName?: string
    phone: string
}

export type FixationCreateInitialSelection = {
    complexId?: string
    propertyId?: number
    apartmentNumber?: string
    rooms?: number
}
