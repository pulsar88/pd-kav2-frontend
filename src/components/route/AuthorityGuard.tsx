import { PropsWithChildren } from 'react'
import { Navigate } from 'react-router'
import useAuthority from '@/utils/hooks/useAuthority'
import { hasAllUserBonuses } from '@/utils/hasUserBonus'
import { useSessionUser } from '@/store/authStore'
import { isContentManagerOnly } from '@/constants/roles.constant'
import type { UserBonus } from '@/@types/auth'
import { useAuth } from '@/auth'
import Loading from '../shared/Loading'

type AuthorityGuardProps = PropsWithChildren<{
    userAuthority?: string[]
    authority?: string[]
    userBonuses?: UserBonus[]
    bonuses?: string[]
    routePath?: string
}>

const AuthorityGuard = (props: AuthorityGuardProps) => {
    const {
        userAuthority = [],
        authority = [],
        userBonuses = [],
        bonuses: requiredBonuses = [],
        routePath,
        children,
    } = props

    const { isVerifying } = useAuth()
    const user = useSessionUser((state) => state.user)

    if (isVerifying) {
        return (
            <div className="flex min-h-96 w-full items-center justify-center">
                <Loading loading={true} />
            </div>
        )
    }
    const isAgent = userAuthority.includes('agent') && !userAuthority.includes('supervisor') && !userAuthority.includes('admin')
    const hasAgency = Boolean(user.agency || user.agencyName)

    // Проверка на наличие агентства действует ТОЛЬКО для агентов (agent)
    if (isAgent && !hasAgency) {
        if (routePath !== '/account/profile') {
            return <Navigate replace to="/account/profile" />
        }
    }

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
