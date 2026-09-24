import Button from '@/components/ui/Button'
import { useUserBlockedStore } from '@/store/userBlockedStore'
import { useAuth } from '@/auth'
import { TbBan, TbLogout } from 'react-icons/tb'

const UserBlockedGate = () => {
    const isBlocked = useUserBlockedStore((s) => s.isBlocked)
    const blockedMessage = useUserBlockedStore((s) => s.blockedMessage)
    const clearBlocked = useUserBlockedStore((s) => s.clearBlocked)
    const { signOut } = useAuth()

    if (!isBlocked) {
        return null
    }

    const handleSignOut = () => {
        clearBlocked()
        void signOut()
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4 dark:bg-gray-950 sm:p-6">
            <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-2xl dark:border-rose-900/50 dark:bg-gray-900 sm:p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                    <TbBan className="text-4xl" />
                </div>

                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                    Доступ ограничен
                </h3>

                <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {blockedMessage || 'Действие учётной записи приостановлено'}
                </p>

                <div className="flex justify-center">
                    <Button
                        variant="solid"
                        className="bg-rose-600 hover:bg-rose-700 w-full sm:w-auto"
                        icon={<TbLogout />}
                        onClick={handleSignOut}
                    >
                        Выйти из аккаунта
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default UserBlockedGate
