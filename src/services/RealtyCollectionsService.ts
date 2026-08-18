import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import { unwrapApiData } from '@/services/auth/authUtils'
import {
    mapRealtyPropertyToPremise,
    REALTY_PROPERTY_WITH,
    type GetRealtyPropertiesResponse,
} from '@/services/ObjectsService'
import type { Premise } from '@/views/objects/types'
import {
    toPremiseSortParams,
    type PremiseSortKey,
} from '@/views/objects/utils'
import { toAxiosParams } from '@/views/objects/realtyPropertyQuery'

type PaginatedApiMeta = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

type RealtyPropertyApi = Parameters<typeof mapRealtyPropertyToPremise>[0]

type PaginatedApiResponse<T> = {
    data: T[]
    meta: PaginatedApiMeta
}

type RealtyCollectionAgentApi = {
    id: number
    name: string
    email?: string
    phone?: string
    country_code?: string
}

type RealtyCollectionApi = {
    id: number
    name: string
    uuid: string
    properties_count: number
    agent?: RealtyCollectionAgentApi
}

export type RealtyCollection = {
    id: number
    name: string
    uuid: string
    propertiesCount: number
    agent?: RealtyCollectionAgentApi
}

export const FAVORITE_COLLECTION_SWR_KEY =
    endpointConfig.realtyCollectionDefault

export type FavoriteCollectionPageData = {
    collection: RealtyCollection | null
    items: Premise[]
    meta: PaginatedApiMeta
}

export const isFavoriteCollectionSwrKey = (
    key: unknown,
): key is readonly [string, number, number, PremiseSortKey | null] =>
    Array.isArray(key) &&
    key.length === 4 &&
    key[0] === FAVORITE_COLLECTION_SWR_KEY &&
    typeof key[1] === 'number' &&
    typeof key[2] === 'number' &&
    (key[3] === null || typeof key[3] === 'string')

export const getFavoriteCollectionSwrKey = (
    page: number,
    perPage: number,
    sort: PremiseSortKey | null,
) => [FAVORITE_COLLECTION_SWR_KEY, page, perPage, sort] as const

let cachedDefaultCollection: RealtyCollection | null = null

export const clearDefaultRealtyCollectionCache = () => {
    cachedDefaultCollection = null
}

const mapRealtyCollectionApi = (item: RealtyCollectionApi): RealtyCollection => ({
    id: item.id,
    name: item.name,
    uuid: item.uuid,
    propertiesCount: item.properties_count,
    agent: item.agent,
})

export async function apiGetDefaultRealtyCollection(
    options: { force?: boolean } = {},
): Promise<RealtyCollection | null> {
    if (!options.force && cachedDefaultCollection) {
        return cachedDefaultCollection
    }

    const response = await ApiService.fetchDataWithAxios<
        RealtyCollectionApi | { data: RealtyCollectionApi }
    >({
        url: endpointConfig.realtyCollectionDefault,
        method: 'get',
    })

    const item = unwrapApiData(response)
    if (!item?.id) return null

    cachedDefaultCollection = mapRealtyCollectionApi(item)
    return cachedDefaultCollection
}

const resolveDefaultCollectionId = async (): Promise<number> => {
    const collection = await apiGetDefaultRealtyCollection()
    if (!collection) {
        throw new Error('Подборка недвижимости не найдена')
    }
    return collection.id
}

export async function apiGetRealtyCollectionProperties(
    collectionId: number,
    params: {
        page?: number
        per_page?: number
        sort?: PremiseSortKey
    } = {},
): Promise<GetRealtyPropertiesResponse> {
    const sortParams = params.sort ? toPremiseSortParams(params.sort) : {}

    const response = await ApiService.fetchDataWithAxios<
        PaginatedApiResponse<RealtyPropertyApi>
    >({
        url: endpointConfig.realtyCollectionProperties(collectionId),
        method: 'get',
        params: toAxiosParams({
            page: params.page ?? 1,
            per_page: params.per_page ?? 20,
            with: REALTY_PROPERTY_WITH,
            ...sortParams,
        }),
    })

    return {
        items: response.data.map(mapRealtyPropertyToPremise),
        meta: response.meta,
    }
}

export async function apiGetAllRealtyCollectionPropertyIds(
    collectionId: number,
): Promise<string[]> {
    const ids: string[] = []
    let page = 1
    let lastPage = 1

    do {
        const { items, meta } = await apiGetRealtyCollectionProperties(
            collectionId,
            { page, per_page: 100 },
        )
        ids.push(...items.map((item) => item.id))
        lastPage = meta.last_page
        page += 1
    } while (page <= lastPage)

    return ids
}

export async function apiGetAllRealtyCollectionProperties(
    collectionId: number,
): Promise<Premise[]> {
    const items: Premise[] = []
    let page = 1
    let lastPage = 1

    do {
        const response = await apiGetRealtyCollectionProperties(collectionId, {
            page,
            per_page: 100,
        })
        items.push(...response.items)
        lastPage = response.meta.last_page
        page += 1
    } while (page <= lastPage)

    return items
}

export async function apiGetDefaultCollectionPropertiesPage(
    params: {
        page?: number
        per_page?: number
        sort?: PremiseSortKey
    } = {},
): Promise<FavoriteCollectionPageData> {
    const collection = await apiGetDefaultRealtyCollection()
    if (!collection) {
        return {
            collection: null,
            items: [],
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: params.per_page ?? 20,
                total: 0,
            },
        }
    }

    const { items, meta } = await apiGetRealtyCollectionProperties(
        collection.id,
        params,
    )

    return { collection, items, meta }
}

/** @deprecated Загружает все страницы подряд — используйте apiGetDefaultCollectionPropertiesPage */
export async function apiGetDefaultCollectionProperties(): Promise<{
    collection: RealtyCollection | null
    items: Premise[]
}> {
    const collection = await apiGetDefaultRealtyCollection()
    if (!collection) {
        return { collection: null, items: [] }
    }

    const items = await apiGetAllRealtyCollectionProperties(collection.id)
    return { collection, items }
}

export async function apiCheckRealtyCollectionProperties(
    ids: Array<string | number>,
    collectionId?: number,
): Promise<string[]> {
    const numericIds = ids
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))

    if (numericIds.length === 0) {
        return []
    }

    const resolvedCollectionId =
        collectionId ?? (await resolveDefaultCollectionId())

    const response = await ApiService.fetchDataWithAxios<
        | { exists_ids: number[] }
        | { data: { exists_ids: number[] } }
    >({
        url: endpointConfig.realtyCollectionCheckProperties(resolvedCollectionId),
        method: 'post',
        data: { ids: numericIds },
    })

    const payload = unwrapApiData(response)
    return (payload.exists_ids ?? []).map(String)
}

export async function apiAddRealtyCollectionProperty(
    propertyId: string | number,
): Promise<void> {
    await ApiService.fetchDataWithAxios({
        url: endpointConfig.realtyCollectionDefaultProperties,
        method: 'post',
        data: { property_id: Number(propertyId) },
    })
}

export async function apiRemoveRealtyCollectionProperty(
    propertyId: string | number,
): Promise<void> {
    await ApiService.fetchDataWithAxios({
        url: endpointConfig.realtyCollectionDefaultProperties,
        method: 'delete',
        data: { property_id: Number(propertyId) },
    })
}
