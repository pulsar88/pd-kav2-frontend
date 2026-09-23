import type { UserBonus } from '@/@types/auth'

const normalizeBonusToken = (value: string) =>
    value.trim().toLowerCase().replace(/-/g, '_')

/**
 * Проверяет наличие бонуса у пользователя по value или code из /current.
 * Пример: value "calculator" / code "CALCULATOR".
 */
export const hasUserBonus = (
    bonuses: UserBonus[] | null | undefined,
    required: string,
): boolean => {
    if (!bonuses?.length || !required) return false

    const target = normalizeBonusToken(required)

    return bonuses.some((bonus) => {
        const value = bonus.value ? normalizeBonusToken(bonus.value) : ''
        const code = bonus.code ? normalizeBonusToken(bonus.code) : ''
        return value === target || code === target
    })
}

/** Пользователь должен иметь все перечисленные бонусы */
export const hasAllUserBonuses = (
    bonuses: UserBonus[] | null | undefined,
    required: string[] | null | undefined,
): boolean => {
    if (!required?.length) return true
    return required.every((item) => hasUserBonus(bonuses, item))
}
