import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import { buildHelpCenterArticlesParams } from '@/views/help-center/helpCenterApiQuery'
import {
    mapCreateArticlePayloadToApiBody,
    mapNewsApiItemToArticle,
    mapNewsApiItemToArticleDetail,
    mapUpdateArticlePayloadToApiBody,
    unwrapNewsApiItemResponse,
} from '@/views/help-center/helpCenterApiMapper'
import type {
    NewsApiItem,
    NewsArticlesApiResponse,
    NewsMediaApiResponse,
} from '@/views/help-center/helpCenterApi.types'
import type {
    CreateSupportHubArticlePayload,
    GetSupportHubArticleResponse,
    GetSupportHubArticlesParams,
    GetSupportHubArticlesResponse,
    UpdateSupportHubArticlePayload,
} from '@/views/help-center/types'

export const resolveMediaUrl = (
    response: NewsMediaApiResponse | string | unknown,
): string => {
    if (!response) return ''
    if (typeof response === 'string') return response
    const raw = response as Record<string, unknown>
    const data = (raw.data ?? raw) as Record<string, unknown>
    if (typeof data === 'string') return data
    if (typeof data?.src === 'string') return data.src
    if (typeof data?.url === 'string') return data.url
    if (typeof data?.path === 'string') return data.path
    if (typeof data?.file_url === 'string') return data.file_url
    if (
        typeof (data?.media as Record<string, unknown> | undefined)?.src ===
        'string'
    ) {
        return (data.media as Record<string, unknown>).src as string
    }
    if (
        typeof (data?.media as Record<string, unknown> | undefined)?.url ===
        'string'
    ) {
        return (data.media as Record<string, unknown>).url as string
    }
    return ''
}

export async function apiGetSupportHubArticles(
    params: GetSupportHubArticlesParams = {},
    listEndpoint = endpointConfig.newsArticles,
): Promise<GetSupportHubArticlesResponse> {
    const response =
        await ApiService.fetchDataWithAxios<NewsArticlesApiResponse>({
            url: listEndpoint,
            method: 'get',
            params: buildHelpCenterArticlesParams(params),
        })

    return {
        list: response.data.map(mapNewsApiItemToArticle),
        total: response.meta?.total ?? response.data.length,
    }
}

export async function apiGetSupportHubArticle<T>({ id }: { id: string }) {
    const response = await ApiService.fetchDataWithAxios<
        NewsApiItem | { data?: NewsApiItem | null }
    >({
        url: endpointConfig.newsItem(id),
        method: 'get',
    })

    const item = unwrapNewsApiItemResponse(response)

    if (!item) {
        throw new Error('Запись не найдена')
    }

    return mapNewsApiItemToArticleDetail(item) as T
}

export async function apiUpdateSupportHubArticle({
    id,
    data,
}: {
    id: string
    data: UpdateSupportHubArticlePayload
}): Promise<GetSupportHubArticleResponse> {
    const response = await ApiService.fetchDataWithAxios<
        NewsApiItem | { data?: NewsApiItem | null }
    >({
        url: endpointConfig.newsItem(id),
        method: 'put',
        data: mapUpdateArticlePayloadToApiBody(data),
    })

    const item = unwrapNewsApiItemResponse(response)

    if (!item) {
        throw new Error('Не удалось сохранить запись')
    }

    return mapNewsApiItemToArticleDetail(item)
}

export async function apiCreateSupportHubArticle({
    data,
}: {
    data: CreateSupportHubArticlePayload
}): Promise<GetSupportHubArticleResponse> {
    const response = await ApiService.fetchDataWithAxios<
        NewsApiItem | { data?: NewsApiItem | null }
    >({
        url: endpointConfig.news,
        method: 'post',
        data: mapCreateArticlePayloadToApiBody(data),
    })

    const item = unwrapNewsApiItemResponse(response)

    if (!item) {
        throw new Error('Не удалось создать запись')
    }

    return mapNewsApiItemToArticleDetail(item)
}

export async function apiDeleteSupportHubArticle({
    id,
}: {
    id: string
}): Promise<void> {
    await ApiService.fetchDataWithAxios({
        url: endpointConfig.newsItem(id),
        method: 'delete',
    })
}

export async function apiUploadNewsMedia({
    newsId,
    file,
}: {
    newsId: string | number
    file: File
}): Promise<string> {
    const formData = new FormData()
    formData.append('media', file)

    const response = await ApiService.fetchDataWithAxios<
        NewsMediaApiResponse | string,
        FormData
    >({
        url: endpointConfig.newsMedia(newsId),
        method: 'post',
        data: formData,
    })

    const url = resolveMediaUrl(response)
    if (!url) {
        throw new Error('Не удалось получить URL загруженного изображения')
    }

    return url
}

export async function apiDeleteNewsMedia({
    newsId,
    file,
}: {
    newsId: string | number
    file: string | string[] | File | File[]
}): Promise<void> {
    const data = (() => {
        if (Array.isArray(file)) {
            if (file.length > 0 && file[0] instanceof File) {
                const fd = new FormData()
                file.forEach((f) => fd.append('file[]', f as File))
                return fd
            }
            return { file }
        }
        if (file instanceof File) {
            const fd = new FormData()
            fd.append('file', file)
            return fd
        }
        return { file }
    })()

    await ApiService.fetchDataWithAxios({
        url: endpointConfig.newsMedia(newsId),
        method: 'delete',
        data,
    })
}
