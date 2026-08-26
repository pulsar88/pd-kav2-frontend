import type {
    Article,
    CreateSupportHubArticlePayload,
    UpdateSupportHubArticlePayload,
} from './types'
import {
    buildArticlePreviewText,
    parseArticleContentFromApi,
    serializeArticleContentForApi,
    stripHtmlToPlainText,
} from './helpCenterContent'
import { buildArticleCode } from './helpCenterCode'
import type {
    CreateNewsApiBody,
    NewsApiItem,
    UpdateNewsApiBody,
} from './helpCenterApi.types'

const defaultAuthor = {
    name: 'Служба поддержки',
    img: '',
}

const CHARS_PER_MINUTE = 900

const estimateTimeToRead = (htmlOrText: string) => {
    const plain = stripHtmlToPlainText(htmlOrText)
    if (!plain) {
        return 1
    }

    return Math.max(1, Math.ceil(plain.length / CHARS_PER_MINUTE))
}

const mapBaseArticleFields = (
    item: NewsApiItem,
    contentHtml: string,
): Article => {
    const preview =
        item.preview_text?.trim() ||
        buildArticlePreviewText(contentHtml || item.content || '')

    return {
        id: String(item.id),
        title: item.name?.trim() || '—',
        content: contentHtml || preview,
        previewText: preview,
        code: item.code?.trim() || undefined,
        authors: [defaultAuthor],
        tags: [],
        starred: false,
        updateTime: '—',
        createdBy: defaultAuthor.name,
        timeToRead: estimateTimeToRead(contentHtml || preview),
        viewCount: 0,
        commentCount: 0,
    }
}

export const mapNewsApiItemToArticle = (item: NewsApiItem): Article => {
    const contentHtml = parseArticleContentFromApi(item.content)
    return mapBaseArticleFields(item, contentHtml)
}

export const mapNewsApiItemToArticleDetail = (item: NewsApiItem) => {
    const contentHtml = parseArticleContentFromApi(item.content)
    const article = mapBaseArticleFields(item, contentHtml)

    return {
        ...article,
        content: contentHtml,
        tableOfContent: [],
    }
}

export const mapCreateArticlePayloadToApiBody = (
    payload: CreateSupportHubArticlePayload,
): CreateNewsApiBody => ({
    ...buildArticlePayloadFields(payload),
    type: String(payload.type),
})

export const mapUpdateArticlePayloadToApiBody = (
    payload: UpdateSupportHubArticlePayload,
): UpdateNewsApiBody => ({
    ...buildArticlePayloadFields(payload),
    type: String(payload.type),
})

const buildArticlePayloadFields = (
    payload: CreateSupportHubArticlePayload | UpdateSupportHubArticlePayload,
) => {
    const code =
        'code' in payload && payload.code?.trim()
            ? payload.code.trim()
            : buildArticleCode(payload.title)

    return {
        name: payload.title.trim(),
        code,
        preview_text:
            payload.previewText.trim() ||
            buildArticlePreviewText(payload.content),
        content: serializeArticleContentForApi(payload.content),
    }
}

export const unwrapNewsApiItemResponse = (
    response: NewsApiItem | { data?: NewsApiItem | null },
): NewsApiItem | null => {
    if (!response || typeof response !== 'object') {
        return null
    }

    if ('data' in response) {
        return response.data ?? null
    }

    if ('id' in response) {
        return response
    }

    return null
}
