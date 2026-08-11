import { mock } from '../MockAdapter'
import {
    categoriesData,
    articleListData,
    articleDetailsById,
    getArticleDetail,
} from '../data/helpCenterData'
import wildCardSearch from '@/utils/wildCardSearch'

mock.onGet(`/helps/categories`).reply(() => {
    return [
        200,
        {
            categories: categoriesData,
            popularArticles: articleListData.filter((article) => article.starred),
        },
    ]
})

mock.onGet(`/helps/articles`).reply((config) => {
    const { topic, query } = config.params || {}
    const articles = [...articleListData]

    if (query) {
        return [200, wildCardSearch(articles, query)]
    }

    if (topic) {
        return [200, articles.filter((article) => article.category === topic)]
    }

    return [200, articles]
})

mock.onGet(/\/helps\/articles\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop()
    const article = articleListData.find((item) => item.id === id)

    if (!article) {
        return [404, { message: 'Статья не найдена' }]
    }

    return [200, { ...article, ...getArticleDetail(article.id) }]
})

mock.onPut(/\/helps\/articles\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop() || ''
    const article = articleListData.find((item) => item.id === id)

    if (!article) {
        return [404, { message: 'Статья не найдена' }]
    }

    const body = JSON.parse(config.data || '{}') as {
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

    return [200, { ...article, ...getArticleDetail(id) }]
})
