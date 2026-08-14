import wildCardSearch from '@/utils/wildCardSearch'
import {
    articleDetailsById,
    articleListData,
    categoriesData,
    getArticleDetail,
} from '@/mock/data/helpCenterData'

const delay = (ms = 120) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms)
    })

export async function apiGetSupportHubCategories<T>() {
    await delay()
    return {
        categories: categoriesData,
        popularArticles: articleListData.filter((article) => article.starred),
    } as T
}

export async function apiGetSupportHubArticles<
    T,
    U extends Record<string, unknown>,
>(params: U) {
    await delay()
    const topic = params.topic as string | undefined
    const query = params.query as string | undefined
    const articles = [...articleListData]

    if (query) {
        return wildCardSearch(
            articles as unknown as Array<Record<string, string | number>>,
            query,
        ) as T
    }

    if (topic) {
        return articles.filter((article) => article.category === topic) as T
    }

    return articles as T
}

export async function apiGetSupportHubArticle<T>({ id }: { id: string }) {
    await delay()
    const article = articleListData.find((item) => item.id === id)

    if (!article) {
        throw new Error('Статья не найдена')
    }

    return { ...article, ...getArticleDetail(article.id) } as T
}

export async function apiUpdateSupportHubArticle<
    T,
    U extends Record<string, unknown>,
>({ id, data }: { id: string; data: U }) {
    await delay()
    const article = articleListData.find((item) => item.id === id)

    if (!article) {
        throw new Error('Статья не найдена')
    }

    const body = data as {
        title?: string
        content?: string
        tags?: { id: string; label: string }[]
    }

    if (body.title) article.title = body.title
    if (body.tags) article.tags = body.tags

    if (body.content) {
        const detail = articleDetailsById[id] || {
            content: body.content,
            tableOfContent: [],
        }
        detail.content = body.content
        articleDetailsById[id] = detail
    }

    return { ...article, ...getArticleDetail(id) } as T
}
