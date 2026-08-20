import { toAxiosParams } from '@/views/objects/realtyPropertyQuery'
import type { GetSupportHubArticlesParams } from './types'

export const DEFAULT_HELP_CENTER_PAGE_SIZE = 20

export const buildHelpCenterArticlesParams = (
    params: GetSupportHubArticlesParams = {},
) => {
    const query: Record<string, string | number> = {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_HELP_CENTER_PAGE_SIZE,
    }

    const search = params.query?.trim()
    if (search) {
        query.search = search
    }

    return toAxiosParams(query)
}
