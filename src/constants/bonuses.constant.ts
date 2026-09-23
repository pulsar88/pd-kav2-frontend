/** Значения bonuses из /current (поле value) */
export const USER_BONUS = {
    CALCULATOR: 'calculator',
    SPECIAL_OFFERS: 'special_offers',
} as const

export type UserBonusValue = (typeof USER_BONUS)[keyof typeof USER_BONUS]
