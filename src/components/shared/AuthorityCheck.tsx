import useAuthority from '@/utils/hooks/useAuthority'
import { useSessionUser } from '@/store/authStore'
import { hasAllUserBonuses } from '@/utils/hasUserBonus'
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

    const userBonuses = useSessionUser((state) => state.user.bonuses)
    const roleMatched = useAuthority(userAuthority, authority)
    const bonusMatched = hasAllUserBonuses(userBonuses, requiredBonuses)

    return <>{roleMatched && bonusMatched ? children : null}</>
}

export default AuthorityCheck
