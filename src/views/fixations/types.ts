export type FixationStatus =
    | 'pending'
    | 'denied'
    | 'fixed'
    | 'registration'
    | 'success'
    | 'failed'
    | 'deleted'

export type FixationAgent = {
    email: string
    fullName: string
    phone: string
    agency: string
}

export type FixationCrm = {
    leadCreated: boolean
    leadExternalId: string | null
}

export type FixationHistoryType =
    | 'created'
    | 'status_changed'
    | 'crm'
    | 'expired'
    | 'rejected'
    | 'deleted'
    | 'comment'
    | 'meeting'
    | 'extended'
    | 'object_changed'

export type FixationHistoryItem = {
    id: string
    type?: FixationHistoryType
    title: string
    description?: string
    createdAt: string
}

export type FixationRelative = {
    id: string
    fullName: string
    phone: string
    relation: string
}

export type FixationObject = {
    id: number
    name: string
    facing?: string | null
    material?: string | null
    building_state?: string | null
    development_start?: string | null
    development_end?: string | null
    address?: string | null
    external_id?: number
}

export type Fixation = {
    id: string
    fullName: string
    phone: string
    status: FixationStatus
    statusLabel?: string
    createdAt: string
    expiresAt: string
    objectName: string
    projectName: string
    objectId: string
    object?: FixationObject
    apartment?: string
    address?: string
    managerName?: string
    managerPhone?: string
    managerPhoto?: string
    note?: string
    desiredArea?: string
    desiredRooms?: string
    paymentFormat?: string
    budget?: string
    meetingDate?: string
    relatives?: FixationRelative[]
    agent: FixationAgent
    crm: FixationCrm
    history: FixationHistoryItem[]
}

export type GetFixationsResponse = {
    list: Fixation[]
    total: number
    meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}
