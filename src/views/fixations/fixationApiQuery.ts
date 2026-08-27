import { toAxiosParams } from '@/views/objects/realtyPropertyQuery'
import type { GetFixationsParams } from './fixationApi.types'

export const FIXATION_LIST_WITH =
    'max_fix_days,agent,crm_status,client,client.phones,manager,initialManager,agency,object'

export const FIXATION_DETAILS_WITH =
    `${FIXATION_LIST_WITH},manager.phone,additionalClients,additionalClients.phones`

export const buildFixationsListParams = (params: GetFixationsParams = {}) => {
    const query: Record<string, string | number | Array<string | number>> = {
        page: params.page ?? 1,
        page_size: params.page_size ?? 20,
        with: FIXATION_LIST_WITH,
        sort_by: 'created_at',
        order: 'desc',
    }

    if (params.status) {
        query.status = params.status
    }

    if (params.search) {
        const trimmed = params.search.trim()
        if (trimmed) {
            query.search = trimmed
        }
    }

    return toAxiosParams(query)
}

export const buildFixationDetailsParams = () =>
    toAxiosParams({
        with: FIXATION_DETAILS_WITH,
    })
