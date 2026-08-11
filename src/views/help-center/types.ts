export type Topic = {
    id: string
    name: string
    description: string
    articleCounts: number
}

export type Article = {
    id: string
    title: string
    content: string
    category: string
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

export type GetSupportHubCategoriesResponse = {
    categories: {
        name: string
        topics: Topic[]
    }[]
    popularArticles: Article[]
}

export type GetSupportHubArticlesResponse = Article[]

export type GetSupportHubArticleResponse = Article & {
    tableOfContent: {
        id: string
        label: string
    }[]
}
