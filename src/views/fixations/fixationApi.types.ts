export type FixationApiStatus =
    | 'pending'
    | 'denied'
    | 'fixed'
    | 'registration'
    | 'success'
    | 'failed'
    | 'deleted'
    | 'expired'

export type FixationApiStatusRelation = {
    value: FixationApiStatus
    code: string
    name: string
}

export type FixationApiProfilePicture = {
    id?: number
    src?: string
    url_path?: string
}

export type FixationApiAgent = {
    id: number
    name: string
    email?: string
    phone?: string
    country_code?: string
    roles?: string[]
    profilePicture?: FixationApiProfilePicture | null
    profile_picture?: FixationApiProfilePicture | null
}

export type FixationApiClientPhone = {
    id: number
    phone: string
    country_code?: string
}

export type FixationApiClient = {
    id: number
    name?: string | null
    second_name?: string | null
    last_name?: string | null
    phones?: FixationApiClientPhone[]
}

export type FixationApiManager = {
    id: number
    name: string
    phone?: string | null
    external_id?: number
    profilePicture?: FixationApiProfilePicture | null
    profile_picture?: FixationApiProfilePicture | null
}

export type FixationApiAgency = {
    id: number
    name: string
    fix_days?: number
}

export type FixationApiBuildingState = {
    value: string
    code: string
    name: string
}

export type FixationApiObject = {
    id: number
    name: string
    facing?: string | null
    material?: string | null
    building_state?: FixationApiBuildingState | null
    development_start?: string | null
    development_end?: string | null
    address?: string | null
    external_id?: number
}

export type FixationApiCrmStatus = {
    lead_created?: boolean
    lead_external_id?: string | null
    external_id?: string | null
}

export type FixationApiPreferenceOption = {
    value?: number | string
    code?: string
    name?: string
}

export type FixationApiRelationOption = {
    value?: number | string
    code?: string
    name?: string
}

export type FixationApiAdditionalClient = FixationApiClient & {
    relation?: {
        relation?: FixationApiRelationOption
    }
}

export type FixationApiItem = {
    id: number
    status: FixationApiStatusRelation
    max_fix_days?: number
    fixed_till?: string
    comment?: string | null
    budget?: number | string | null
    meeting_date?: string | null
    preferred_rooms_count?: FixationApiPreferenceOption | null
    preferred_area?: FixationApiPreferenceOption | null
    preferred_payment?: FixationApiPreferenceOption | null
    created_at: string
    agent?: FixationApiAgent
    client?: FixationApiClient
    additional_clients?: FixationApiAdditionalClient[]
    additionalClients?: FixationApiAdditionalClient[]
    manager?: FixationApiManager
    initialManager?: FixationApiManager
    initial_manager?: FixationApiManager
    agency?: FixationApiAgency
    object?: FixationApiObject
    crm_status?: FixationApiCrmStatus
    has_extend_request?: boolean
}

export type FixationsApiMeta = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export type FixationsApiResponse = {
    data: FixationApiItem[]
    meta: FixationsApiMeta
}

export type GetFixationsParams = {
    page?: number
    page_size?: number
    status?: FixationApiStatus | FixationApiStatus[]
    search?: string
}
