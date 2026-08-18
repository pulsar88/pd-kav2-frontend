export type Article = {
    id: string
    title: string
    content: string
    previewText?: string
    code?: string
    category?: string
    authors: {
        name: string
        img: string
    }[]
    tags?: {
        id: string
        label: string
    }[]
    starred: boolean
    updateTime: string
    createdBy: string
    timeToRead: number
    viewCount: number
    commentCount: number
    tableOfContent?: {
        id: string
        label: string
    }[]
}

export type GetSupportHubArticlesParams = {
    query?: string
    page?: number
    page_size?: number
}

export type GetSupportHubArticlesResponse = {
    list: Article[]
    total: number
}

export type GetSupportHubArticleResponse = Article & {
    tableOfContent: {
        id: string
        label: string
    }[]
}

export type CreateSupportHubArticlePayload = {
    title: string
    previewText: string
    content: string
    type: number
}

export type UpdateSupportHubArticlePayload = {
    title: string
    previewText: string
    content: string
    code?: string
    type: number
}
