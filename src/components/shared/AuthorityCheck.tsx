import useAuthority from '@/utils/hooks/useAuthority'
import { useSessionUser } from '@/store/authStore'
import { hasAllUserBonuses } from '@/utils/hasUserBonus'
import { isContentManagerOnly } from '@/constants/roles.constant'
import type { CommonProps } from '@/@types/common'

interface AuthorityCheckProps extends CommonProps {
    userAuthority: string[]
    authority: string[]
    /** Обязательные bonuses; пусто/не задано = без проверки */
    bonuses?: string[]
}

const AuthorityCheck = (props: AuthorityCheckProps) => {
    const {
        userAuthority = [],
        authority = [],
        bonuses: requiredBonuses = [],
        children,
    } = props

    const user = useSessionUser((state) => state.user)
    const isSpecialRole = isContentManagerOnly(userAuthority)
    const hasAgency = Boolean(user.agency || user.agencyName)

    const userBonuses = user.bonuses
    const roleMatched = useAuthority(userAuthority, authority)
    const bonusMatched = hasAllUserBonuses(userBonuses, requiredBonuses)

    // Если нет агентства, скрываем пункты меню ПОСЛЕ вызова хуков
    if (!hasAgency && !isSpecialRole) {
        return null
    }

    return <>{roleMatched && bonusMatched ? children : null}</>
}

export default AuthorityCheck
