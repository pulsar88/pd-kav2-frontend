import { create } from 'zustand'

type CommonState = {
    showFloorPlan: boolean // показать план этажа
}

type CommonAction = {
    setShowFloorPlan: (payload: boolean) => void
}

const initialState: CommonState = {
    showFloorPlan: false,
}

export const useCommonStore = create<CommonState & CommonAction>((set) => ({
    ...initialState,
    setShowFloorPlan: (payload: boolean) =>
        set(() => ({ showFloorPlan: payload })),
}))
