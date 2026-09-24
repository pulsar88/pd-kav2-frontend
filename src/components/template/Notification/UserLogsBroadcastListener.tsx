import { useEffect, useState } from 'react'
import broadcastConfig from '@/configs/broadcast.config'
import { apiGetCurrentUser } from '@/services/AuthService'
import { disconnectEcho } from '@/services/broadcast/echo'
import { subscribeUserLogsBroadcast } from '@/services/broadcast/userLogsBroadcast'
import { useSessionUser, useToken } from '@/store/authStore'

const UserLogsBroadcastListener = () => {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const { token } = useToken()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // При смене токена или выходе сразу глушим старый сокет
    useEffect(() => {
        disconnectEcho()
    }, [token])

    useEffect(() => {
        if (!signedIn || !token) {
            disconnectEcho()
            setCurrentUserId(null)
            return undefined
        }

        let cancelled = false

        // Всегда проверяем актуального пользователя нового токена перед подпиской
        void apiGetCurrentUser().then((currentUser) => {
            if (cancelled) return

            if (currentUser.userId) {
                setUser(currentUser)
                setCurrentUserId(currentUser.userId)
            }
        }).catch(() => {
            // Ошибка авторизации
        })

        return () => {
            cancelled = true
        }
    }, [signedIn, token, setUser])

    useEffect(() => {
        if (!broadcastConfig.enabled || !signedIn || !currentUserId || !token) {
            return undefined
        }

        const unsubscribe = subscribeUserLogsBroadcast(currentUserId)

        return () => {
            unsubscribe?.()
        }
    }, [signedIn, token, currentUserId])

    return null
}

export default UserLogsBroadcastListener
