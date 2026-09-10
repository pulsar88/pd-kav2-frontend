import appConfig from '@/configs/app.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/auth'
import { setInvitationTokenInStorage } from '@/utils/invitationTokenStorage'

const { unAuthenticatedEntryPath } = appConfig

const INVITATION_PATH_RE = /^\/invitations\/([^/]+)\/?$/

const ProtectedRoute = () => {
    const { authenticated } = useAuth()

    const pathName = location.pathname

    const getPathName =
        pathName === '/' ? '' : `?${REDIRECT_URL_KEY}=${pathName}`

    if (!authenticated) {
        const invitationMatch = pathName.match(INVITATION_PATH_RE)
        if (invitationMatch?.[1]) {
            setInvitationTokenInStorage(decodeURIComponent(invitationMatch[1]))
        }

        return (
            <Navigate
                replace
                to={`${unAuthenticatedEntryPath}${getPathName}`}
            />
        )
    }

    return <Outlet />
}

export default ProtectedRoute
