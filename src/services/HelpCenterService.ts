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
} from '@/views/help-center/helpCenterApi.types'
import type {
    CreateSupportHubArticlePayload,
    GetSupportHubArticleResponse,
    GetSupportHubArticlesParams,
    GetSupportHubArticlesResponse,
    UpdateSupportHubArticlePayload,
} from '@/views/help-center/types'

export async function apiGetSupportHubArticles(
    params: GetSupportHubArticlesParams = {},
    listEndpoint = endpointConfig.newsArticles,
): Promise<GetSupportHubArticlesResponse> {
    const response = await ApiService.fetchDataWithAxios<NewsArticlesApiResponse>(
        {
            url: listEndpoint,
            method: 'get',
            params: buildHelpCenterArticlesParams(params),
        },
    )

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
