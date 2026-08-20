import { useEffect, useState } from 'react'
import broadcastConfig from '@/configs/broadcast.config'
import { apiGetCurrentUser } from '@/services/AuthService'
import { disconnectEcho } from '@/services/broadcast/echo'
import { subscribeUserLogsBroadcast } from '@/services/broadcast/userLogsBroadcast'
import { useSessionUser, useToken } from '@/store/authStore'

const UserLogsBroadcastListener = () => {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const userId = useSessionUser((state) => state.user.userId)
    const setUser = useSessionUser((state) => state.setUser)
    const { token } = useToken()
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(
        userId ?? null,
    )

    useEffect(() => {
        if (userId) {
            setResolvedUserId(userId)
            return undefined
        }

        if (!signedIn || !token) {
            setResolvedUserId(null)
            return undefined
        }

        let cancelled = false

        void apiGetCurrentUser().then((currentUser) => {
            if (cancelled) {
                return
            }

            if (currentUser.userId) {
                setResolvedUserId(currentUser.userId)
                setUser(currentUser)
            }
        })

        return () => {
            cancelled = true
        }
    }, [signedIn, token, userId, setUser])

    useEffect(() => {
        if (!broadcastConfig.enabled || !signedIn || !resolvedUserId || !token) {
            return undefined
        }

        disconnectEcho()
        const unsubscribe = subscribeUserLogsBroadcast(resolvedUserId)

        return () => {
            unsubscribe?.()
        }
    }, [signedIn, token, resolvedUserId])

    useEffect(() => {
        if (!signedIn || !token) {
            disconnectEcho()
        }
    }, [signedIn, token])

    return null
}

export default UserLogsBroadcastListener
