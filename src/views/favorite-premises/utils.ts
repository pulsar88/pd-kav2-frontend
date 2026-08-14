import { apiGetRealtyProperty } from '@/services/ObjectsService'
import type { Premise } from '@/views/objects/types'

export const mergePremiseDetails = (
    premise: Premise,
    details: Premise | null,
): Premise => {
    if (!details) return premise

    return {
        ...premise,
        complexId: premise.complexId ?? details.complexId,
        complexName: premise.complexName ?? details.complexName,
        address: premise.address ?? details.address,
        material: premise.material ?? details.material,
        facing: premise.facing ?? details.facing,
        buildingState: premise.buildingState ?? details.buildingState,
        houseStatus: premise.houseStatus ?? details.houseStatus,
        developmentStart: premise.developmentStart ?? details.developmentStart,
        deliveryDate: premise.deliveryDate ?? details.deliveryDate,
        section: premise.section ?? details.section,
        goodArea: premise.goodArea ?? details.goodArea,
        typeName: premise.typeName ?? details.typeName,
        layout: premise.layout ?? details.layout,
        layoutImage: premise.layoutImage ?? details.layoutImage,
        floorPlanImage: premise.floorPlanImage ?? details.floorPlanImage,
        price: premise.price ?? details.price,
        pricePerSqm: premise.pricePerSqm ?? details.pricePerSqm,
    }
}

export const enrichPremisesList = async (
    premises: Premise[],
): Promise<Premise[]> =>
    Promise.all(
        premises.map(async (premise) => {
            const details = await apiGetRealtyProperty(premise.id)
            return mergePremiseDetails(premise, details)
        }),
    )
