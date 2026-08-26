import { Navigate, Outlet } from 'react-router'
import appConfig from '@/configs/app.config'
import { getAuthenticatedEntryPath } from '@/constants/roles.constant'
import { useAuth } from '@/auth'
import { useSessionUser } from '@/store/authStore'

const PublicRoute = () => {
    const { authenticated } = useAuth()
    const authority = useSessionUser((state) => state.user.authority) ?? []

    return authenticated ? (
        <Navigate
            to={getAuthenticatedEntryPath(
                authority,
                appConfig.authenticatedEntryPath,
            )}
        />
    ) : (
        <Outlet />
    )
}

export default PublicRoute
