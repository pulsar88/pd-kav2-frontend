export type FixationClient = {
    id: string
    fullName: string
    phone: string
}

export type GetFixationClientsParams = {
    q?: string
    page?: number
    limit?: number
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

export type CreateFixationPayload = {
    clientId: string
    complexId: string
    complexName?: string
    complexAddress?: string
    apartmentId?: string
    managerId?: string
    relatives?: CreateFixationRelativePayload[]
    note?: string
    desiredArea?: string
    desiredRooms?: string
    paymentFormat?: string
    budget?: string
    meetingDate?: string
}

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
