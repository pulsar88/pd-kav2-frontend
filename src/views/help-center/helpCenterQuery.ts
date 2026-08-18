export const publicationListKey = (
    listEndpoint: string,
    query = '',
    page = 1,
    pageSize = 20,
) => [listEndpoint, query, page, pageSize] as const

export const publicationItemKey = (id: string) =>
    [`/api/v2/news/${id}`, { id }] as const

export const isPublicationListKey = (listEndpoint: string) =>
    (key: unknown) => Array.isArray(key) && key[0] === listEndpoint
