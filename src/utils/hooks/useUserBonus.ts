import { useSessionUser } from '@/store/authStore'
import { hasUserBonus } from '@/utils/hasUserBonus'

export const useHasUserBonus = (required: string): boolean => {
    const bonuses = useSessionUser((state) => state.user.bonuses)
    return hasUserBonus(bonuses, required)
}

export default useHasUserBonus
