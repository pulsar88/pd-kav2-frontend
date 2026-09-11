import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { TbBuilding, TbLink, TbAlertCircle } from 'react-icons/tb'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Loading from '@/components/shared/Loading'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useAuth } from '@/auth'
import { useSessionUser } from '@/store/authStore'
import { apiGetCurrentUser } from '@/services/AuthService'
import {
    apiCheckInvitation,
    apiLinkInvitation,
} from '@/services/InvitationsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    clearInvitationTokenFromStorage,
    setInvitationTokenInStorage,
} from '@/utils/invitationTokenStorage'
import type { Invitation } from '@/@types/invitation'

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')

    return `${hh}:${mm} ${day}.${month}.${yyyy}`
}

const InvitationJoin = () => {
    const { token: rawToken } = useParams<{ token: string }>()
    const token = rawToken ? decodeURIComponent(rawToken) : ''
    const navigate = useNavigate()
    const { user } = useAuth()
    const setUser = useSessionUser((state) => state.setUser)

    const [invitation, setInvitation] = useState<Invitation | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isJoining, setIsJoining] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const hasAgency = Boolean(user.agency)

    useEffect(() => {
        if (token) {
            setInvitationTokenInStorage(token)
        }
    }, [token])

    const loadInvitation = useCallback(async () => {
        if (!token) {
            setErrorMessage('Ссылка приглашения некорректна')
            setIsLoading(false)
            return
        }

        if (hasAgency) {
            clearInvitationTokenFromStorage()
            setInvitation(null)
            setErrorMessage(null)
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setErrorMessage(null)

        try {
            const data = await apiCheckInvitation(token)
            setInvitation(data)
        } catch (err: unknown) {
            setInvitation(null)
            setErrorMessage(
                getApiErrorMessage(err, 'Приглашение не найдено или недействительно'),
            )
        } finally {
            setIsLoading(false)
        }
    }, [token, hasAgency])

    useEffect(() => {
        void loadInvitation()
    }, [loadInvitation])

    const handleJoin = async () => {
        if (!token || hasAgency) return

        setIsJoining(true)
        try {
            await apiLinkInvitation(token)
            clearInvitationTokenFromStorage()

            try {
                const currentUser = await apiGetCurrentUser()
                setUser(currentUser)
            } catch {
                // сессия обновится при следующем auth check
            }

            toast.push(
                <Notification type="success">
                    Вы успешно присоединились к агентству
                </Notification>,
                { placement: 'top-center' },
            )
            navigate('/home', { replace: true })
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось присоединиться к агентству',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsJoining(false)
        }
    }

    const agencyName =
        invitation?.agency?.name || user.agencyName || 'агентство'
    const expiresAt = invitation?.permanent
        ? null
        : formatDate(invitation?.active_till || invitation?.expires_at)

    return (
        <Container className="max-w-xl">
            <div className="mb-6">
                <h3 className="mb-1">Приглашение в агентство</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Проверьте данные и подтвердите присоединение
                </p>
            </div>

            <AdaptiveCard>
                <Loading loading={isLoading}>
                    {hasAgency ? (
                        <div className="flex flex-col items-center text-center py-10 px-4">
                            <TbBuilding className="text-4xl text-primary mb-3" />
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                Вы уже состоите в агентстве
                            </p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                Присоединиться по приглашению можно только без
                                текущего агентства
                                {user.agency?.name
                                    ? ` (сейчас: ${user.agency.name})`
                                    : ''}
                                .
                            </p>
                            <Button
                                className="mt-6"
                                variant="solid"
                                onClick={() => navigate('/account/profile')}
                            >
                                Перейти в профиль
                            </Button>
                        </div>
                    ) : errorMessage ? (
                        <div className="flex flex-col items-center text-center py-10 px-4">
                            <TbAlertCircle className="text-4xl text-rose-500 mb-3" />
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                Не удалось открыть приглашение
                            </p>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                {errorMessage}
                            </p>
                            <Button
                                className="mt-6"
                                onClick={() => navigate('/home')}
                            >
                                На главную
                            </Button>
                        </div>
                    ) : invitation ? (
                        <div className="flex flex-col gap-6 py-4 px-1 sm:px-2">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <TbLink className="text-2xl" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Агентство
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {agencyName}
                                    </p>
                                    {expiresAt ? (
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Действует до {expiresAt}
                                        </p>
                                    ) : null}
                                    {invitation.status ? (
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Статус: {invitation.status}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <Button
                                variant="solid"
                                className="w-full sm:w-auto sm:self-start"
                                loading={isJoining}
                                icon={<TbBuilding />}
                                onClick={() => void handleJoin()}
                            >
                                Присоединиться
                            </Button>
                        </div>
                    ) : null}
                </Loading>
            </AdaptiveCard>
        </Container>
    )
}

export default InvitationJoin
