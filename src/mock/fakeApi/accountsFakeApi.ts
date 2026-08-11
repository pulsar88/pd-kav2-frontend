import { mock } from '../MockAdapter'
import { profileData } from '../data/accountsData'

mock.onGet(`/setting/profile`).reply(() => {
    return [200, profileData]
})

mock.onPut(`/setting/profile`).reply((config) => {
    const data = JSON.parse(config.data as string)
    Object.assign(profileData, data)
    return [200, profileData]
})

mock.onPut(`/setting/password`).reply(() => {
    return [200, { success: true }]
})
