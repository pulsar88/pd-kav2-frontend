export const NEWS_TYPE = {
    NEWS: 10,
    EVENT: 20,
    ARTICLE: 30,
} as const

export type NewsApiType = {
    value: number
    code?: string
    name?: string | null
}

export type NewsApiItem = {
    id: number
    name: string
    code?: string
    preview_text?: string | null
    content?: string | null
    type?: NewsApiType
}

export type NewsArticlesApiMeta = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export type NewsArticlesApiResponse = {
    data: NewsApiItem[]
    meta: NewsArticlesApiMeta
}

export type CreateNewsApiBody = {
    name: string
    code: string
    preview_text: string
    content: string
    type: string
}

export type UpdateNewsApiBody = {
    name: string
    code: string
    preview_text: string
    content: string
    type: string
}
