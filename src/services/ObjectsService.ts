import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    Complex,
    HouseStatus,
    Premise,
    PremiseType,
    ObjectsSearchFilters,
    RealtyProject,
    RealtyPropertiesFilters,
    RealtyPropertyTypeCode,
} from '@/views/objects/types'
import {
    mapObjectsSearchFiltersToApiParams,
    normalizeRealtyPropertyTypeCode,
    toAxiosParams,
} from '@/views/objects/realtyPropertyQuery'
import type { PremiseSortKey } from '@/views/objects/utils'
import { toPremiseSortParams } from '@/views/objects/utils'
import type { CheckboardBuilding } from '@/views/objects/checkboard.types'
import {
    mapChessToCheckboardBuilding,
    type ChessBuildingApi,
} from '@/views/objects/checkboardMapper'

type RealtyObjectApi = {
    id: number
    name: string
    facing?: string
    material?: string
    building_state?: BuildingState | null
    development_start?: string
    development_end?: string
    address?: string
    external_id?: number
    image?: RealtyPropertyImageApi | string | null
    project?: RealtyProjectApi | null
}

type BuildingState = {
    value: string
    code: string
    name: string
}

type RealtyPropertyTypeApi = {
    value: string
    code: string
    name: string
}

type RealtyPropertyImageApi = {
    src?: string
    url?: string
}

type RealtyPropertyPresetApi = {
    id?: number
    name?: string
    external_id?: number
    image?: RealtyPropertyImageApi | string | null
}

type RealtyObjectBriefApi = {
    id: number
    name: string
    external_id?: number
    address?: string
    facing?: string
    material?: string
    building_state?: BuildingState | null
    development_start?: string
    development_end?: string
    image?: RealtyPropertyImageApi | string | null
}

type RealtyFloorPlanApi = {
    id?: number
    src?: string
    url?: string
}

type RealtyFloorApi = {
    id?: number
    number?: number
    floor_plan?: RealtyFloorPlanApi | string | null
}

type RealtyPropertyApi = {
    id: number
    number: string
    section: string
    floor: number
    floor_path?: string
    area: number
    good_area: number
    type: RealtyPropertyTypeApi
    rooms_count: number
    external_id: number
    price?: number
    price_per_sqm?: number
    preset?: RealtyPropertyPresetApi | null
    realty_floor?: RealtyFloorApi | null
    realty_object_id?: number
    realty_object?: RealtyObjectBriefApi | null
    object_id?: number
    object?: RealtyObjectBriefApi | null
    project?: RealtyProjectApi | null
}

export const REALTY_PROPERTY_WITH =
    'preset.image,object,realtyFloor.floorPlan,project,object.image'

const REALTY_OBJECT_WITH = 'image,project'

type PaginatedApiMeta = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

type PaginatedApiResponse<T> = {
    data: T[]
    meta: PaginatedApiMeta
}

export type GetRealtyPropertiesResponse = {
    items: Premise[]
    meta: PaginatedApiMeta
}

export type GetRealtyPropertiesSummaryResponse = {
    items: Complex[]
    meta: PaginatedApiMeta
}

const mapTypeCodeToPremiseType = (code: string): PremiseType => {
    const normalized = code.toLowerCase()
    if (normalized === 'property' || normalized === 'apartment') {
        return 'apartment'
    }
    if (normalized === 'apartments') return 'apartments'
    return 'commercial'
}

const normalizeTypeCode = (code: string): RealtyPropertyTypeCode | string =>
    normalizeRealtyPropertyTypeCode(code) ?? code.toLowerCase()

const resolvePresetImageUrl = (
    preset?: RealtyPropertyPresetApi | null,
): string | undefined => {
    if (!preset?.image) {
        return undefined
    }

    if (typeof preset.image === 'string') {
        return preset.image
    }

    return preset.image.src || preset.image.url
}

const resolveFloorPlanImageUrl = (
    floor?: RealtyFloorApi | null,
): string | undefined => {
    const plan = floor?.floor_plan

    if (!plan) {
        return undefined
    }

    if (typeof plan === 'string') {
        return plan
    }

    return plan.src || plan.url
}

const resolvePremiseLayoutName = (item: RealtyPropertyApi) =>
    item.preset?.name ? `Планировка ${item.preset.name}` : undefined

const resolvePremiseLayoutLabel = (item: RealtyPropertyApi) => {
    const sectionLabel = item.section ? `Секция ${item.section}` : undefined
    const presetLabel = resolvePremiseLayoutName(item)

    if (sectionLabel && presetLabel) {
        return `${sectionLabel} · ${presetLabel}`
    }

    return presetLabel ?? sectionLabel
}

const unwrapRealtyPropertyResponse = (
    response: RealtyPropertyApi | { data?: RealtyPropertyApi | null },
): RealtyPropertyApi | null => {
    if (!response || typeof response !== 'object') {
        return null
    }

    if ('data' in response) {
        return response.data ?? null
    }

    if ('id' in response && 'number' in response) {
        return response
    }

    return null
}

type RealtyPropertySummaryImageApi = {
    src?: string
}

type RealtyPropertySummaryApi = {
    id: number
    name: string
    image?: RealtyPropertySummaryImageApi | null
    address?: string | null
    completion_date?: string | null
    delivery_date?: string | null
    count_filter: number
    count: number
    min_price: number
    min_price_m2: number
}

type SummaryApiResponse = PaginatedApiResponse<RealtyPropertySummaryApi>

type RealtyFilterOptionApi = {
    value: string
    code: string
    name: string
}

type RealtyPropertiesFiltersApiResponse = {
    projects: RealtyProjectApi[]
    realty_types: RealtyFilterOptionApi[]
    realty_rooms: RealtyFilterOptionApi[]
}

const mapRealtyFilterOption = (
    item: RealtyFilterOptionApi,
): { value: string; label: string } => ({
    value: item.value,
    label: item.name,
})

type RealtyProjectApi = {
    id: number
    name: string
    external_id?: number
    promo_text?: string | null
}

type RealtyProjectsApiResponse =
    | RealtyProjectApi[]
    | {
          data: RealtyProjectApi[]
      }

const mapRealtyProjectApiToProject = (item: RealtyProjectApi): RealtyProject => ({
    id: String(item.id),
    name: item.name,
})

const unwrapRealtyProjectsResponse = (
    response: RealtyProjectsApiResponse,
): RealtyProjectApi[] => {
    if (Array.isArray(response)) {
        return response
    }

    return response.data ?? []
}

const resolveRealtyObjectImageUrl = (
    image?: RealtyPropertyImageApi | string | null,
): string | undefined => {
    if (!image) {
        return undefined
    }

    if (typeof image === 'string') {
        return image
    }

    return image.src || image.url
}

const mapRealtyObjectToComplex = (item: RealtyObjectApi): Complex => ({
    id: String(item.id),
    name: item.name,
    externalId: item.external_id,
    image: resolveRealtyObjectImageUrl(item.image),
    address: item.address?.trim() || undefined,
    completionDate: item.development_end?.trim() || undefined,
    promoText: item.project?.promo_text?.trim() || undefined,
})

const mapRealtyPropertySummaryToComplex = (
    item: RealtyPropertySummaryApi,
): Complex => ({
    id: String(item.id),
    name: item.name,
    image: item.image?.src,
    address: item.address?.trim() || undefined,
    apartmentsCount: item.count,
    priceFrom: item.min_price,
    pricePerSqm: item.min_price_m2,
    matchingPremisesCount: item.count_filter,
    completionDate:
        item.completion_date?.trim() ||
        item.delivery_date?.trim() ||
        undefined,
})

const mapBuildingStateToHouseStatus = (
    state?: BuildingState | null,
): HouseStatus | undefined => {
    if (!state?.code) return undefined

    switch (state.code) {
        case 'HAND_OVER':
            return 'commissioned'
        case 'UNFINISHED':
            return 'under_construction'
        case 'BUILT': 
            return 'commissioned'
        default:
            return undefined
    }
}

const mapRealtyObjectFields = (realtyObject?: RealtyObjectBriefApi | null) => ({
    complexId:
        realtyObject?.id != null ? String(realtyObject.id) : undefined,
    complexName: realtyObject?.name,
    address: realtyObject?.address?.trim() || undefined,
    facing: realtyObject?.facing?.trim() || undefined,
    material: realtyObject?.material?.trim() || undefined,
    buildingState: realtyObject?.building_state?.name?.trim() || undefined,
    houseStatus: mapBuildingStateToHouseStatus(realtyObject?.building_state),
    developmentStart: realtyObject?.development_start?.trim() || undefined,
    deliveryDate: realtyObject?.development_end?.trim() || undefined,
    complexImage: resolveRealtyObjectImageUrl(realtyObject?.image),
})

export const mapRealtyPropertyToPremise = (item: RealtyPropertyApi): Premise => {
    const realtyObject = item.object ?? item.realty_object
    const objectFields = mapRealtyObjectFields(realtyObject)

    return {
        id: String(item.id),
        checkboardPropertyId: item.external_id,
        externalId: item.external_id,
        number: item.number,
        section: item.section,
        type: mapTypeCodeToPremiseType(item.type.code),
        typeCode: normalizeTypeCode(item.type.code),
        typeName: item.type.name,
        rooms: item.rooms_count,
        area: item.area,
        goodArea: item.good_area,
        floor: item.floor,
        price: item.price,
        pricePerSqm: item.price_per_sqm,
        layout: resolvePremiseLayoutLabel(item),
        layoutName: resolvePremiseLayoutName(item),
        layoutImage: resolvePresetImageUrl(item.preset),
        floorPlanImage: resolveFloorPlanImageUrl(item.realty_floor),
        floorPath: item.floor_path?.trim() || undefined,
        promoText: item.project?.promo_text?.trim() || undefined,
        ...objectFields,
        complexId:
            objectFields.complexId ??
            (item.object_id != null
                ? String(item.object_id)
                : item.realty_object_id != null
                  ? String(item.realty_object_id)
                  : undefined),
    }
}

export async function apiGetRealtyPropertiesSummary(
    params: {
        page?: number
        per_page?: number
        filters?: ObjectsSearchFilters
    } = {},
): Promise<GetRealtyPropertiesSummaryResponse> {
    const filterParams = params.filters
        ? mapObjectsSearchFiltersToApiParams(params.filters)
        : {}

    const response = await ApiService.fetchDataWithAxios<SummaryApiResponse>({
        url: endpointConfig.realtyPropertiesSummary,
        method: 'get',
        params: toAxiosParams({
            page: params.page ?? 1,
            per_page: params.per_page ?? 20,
            ...filterParams,
        }),
    })

    return {
        items: response.data.map(mapRealtyPropertySummaryToComplex),
        meta: response.meta,
    }
}

export async function apiGetRealtyObject(
    id: string | number,
): Promise<Complex | null> {
    const response = await ApiService.fetchDataWithAxios<{
        data: RealtyObjectApi
    }>({
        url: endpointConfig.realtyObject(id),
        method: 'get',
        params: {
            with: REALTY_OBJECT_WITH,
        },
    })

    if (!response.data) return null

    return mapRealtyObjectToComplex(response.data)
}

export async function apiGetRealtyProjects(): Promise<RealtyProject[]> {
    const response =
        await ApiService.fetchDataWithAxios<RealtyProjectsApiResponse>({
            url: endpointConfig.realtyProjects,
            method: 'get',
        })

    return unwrapRealtyProjectsResponse(response).map(
        mapRealtyProjectApiToProject,
    )
}

export async function apiGetRealtyPropertiesFilters(): Promise<RealtyPropertiesFilters> {
    const response =
        await ApiService.fetchDataWithAxios<RealtyPropertiesFiltersApiResponse>(
            {
                url: endpointConfig.realtyPropertiesFilters,
                method: 'get',
            },
        )

    return {
        projects: response.projects.map(mapRealtyProjectApiToProject),
        realtyTypes: response.realty_types.map(mapRealtyFilterOption),
        realtyRooms: response.realty_rooms.map(mapRealtyFilterOption),
    }
}

export async function apiGetRealtyProperties(
    params: {
        page?: number
        per_page?: number
        filters?: ObjectsSearchFilters
        sort?: PremiseSortKey
    } = {},
): Promise<GetRealtyPropertiesResponse> {
    const filterParams = params.filters
        ? mapObjectsSearchFiltersToApiParams(params.filters)
        : {}
    const sortParams = params.sort ? toPremiseSortParams(params.sort) : {}

    const response = await ApiService.fetchDataWithAxios<
        PaginatedApiResponse<RealtyPropertyApi>
    >({
        url: endpointConfig.realtyProperties,
        method: 'get',
        params: toAxiosParams({
            page: params.page ?? 1,
            per_page: params.per_page ?? 20,
            with: REALTY_PROPERTY_WITH,
            ...sortParams,
            ...filterParams,
        }),
    })

    return {
        items: response.data.map(mapRealtyPropertyToPremise),
        meta: response.meta,
    }
}

export async function apiGetRealtyProperty(
    propertyId: string | number,
): Promise<Premise | null> {
    const response = await ApiService.fetchDataWithAxios<
        RealtyPropertyApi | { data?: RealtyPropertyApi | null }
    >({
        url: endpointConfig.realtyProperty(propertyId),
        method: 'get',
        params: {
            with: REALTY_PROPERTY_WITH,
        },
    })

    const item = unwrapRealtyPropertyResponse(response)
    if (!item) return null

    return mapRealtyPropertyToPremise(item)
}

export async function apiGetCheckboard(
    complexId: string,
): Promise<CheckboardBuilding | null> {
    const response = await ApiService.fetchDataWithAxios<{
        data: ChessBuildingApi
    }>({
        url: endpointConfig.realtyObjectChess(complexId),
        method: 'get',
    })

    if (!response.data) return null

    return mapChessToCheckboardBuilding(response.data)
}
