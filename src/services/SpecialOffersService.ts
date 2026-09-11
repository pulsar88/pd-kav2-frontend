import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    SpecialOffer,
    SpecialOfferDetailResponse,
    SpecialOffersListResponse,
} from '@/views/special-offers/types'

export async function apiGetSpecialOffers(): Promise<SpecialOffer[]> {
    const response =
        await ApiService.fetchDataWithAxios<SpecialOffersListResponse>({
            url: endpointConfig.specialOffers,
            method: 'get',
        })

    return response.data ?? []
}

export async function apiGetSpecialOffer(
    id: string | number,
): Promise<SpecialOffer> {
    const response =
        await ApiService.fetchDataWithAxios<SpecialOfferDetailResponse>({
            url: endpointConfig.specialOffer(id),
            method: 'get',
        })

    if (!response.data) {
        throw new Error('Акция не найдена')
    }

    return response.data
}
