import { PropsWithChildren } from 'react'
import { Navigate } from 'react-router'
import useAuthority from '@/utils/hooks/useAuthority'
import { hasAllUserBonuses } from '@/utils/hasUserBonus'
import type { UserBonus } from '@/@types/auth'

type AuthorityGuardProps = PropsWithChildren<{
    userAuthority?: string[]
    authority?: string[]
    userBonuses?: UserBonus[]
    bonuses?: string[]
}>

const AuthorityGuard = (props: AuthorityGuardProps) => {
    const {
        userAuthority = [],
        authority = [],
        userBonuses = [],
        bonuses: requiredBonuses = [],
        children,
    } = props

    const roleMatched = useAuthority(userAuthority, authority)
    const bonusMatched = hasAllUserBonuses(userBonuses, requiredBonuses)

    return (
        <>
            {roleMatched && bonusMatched ? (
                children
            ) : (
                <Navigate to="/access-denied" />
            )}
        </>
    )
}

export default AuthorityGuard
