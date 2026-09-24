import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import PasswordInput from '@/components/shared/PasswordInput'
import PhoneInput from '@/components/shared/PhoneInput'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { toAuthPhonePayload } from '@/services/auth/authUtils'
import { apiSignIn, apiGetCurrentUser } from '@/services/AuthService'
import { useFavoriteAccountsStore } from '@/store/favoriteAccountsStore'
import { useToken, useSessionUser } from '@/store/authStore'
import { TbUserPlus, TbLock, TbPhone } from 'react-icons/tb'

type SwitchAccountDialogProps = {
    isOpen: boolean
    onClose: () => void
}

const SwitchAccountDialog = ({ isOpen, onClose }: SwitchAccountDialogProps) => {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { setToken } = useToken()
    const addFavoriteAccount = useFavoriteAccountsStore((s) => s.addFavoriteAccount)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone.trim() || !password.trim()) {
            toast.push(
                <Notification title="Ошибка" type="danger">
                    Введите телефон и пароль
                </Notification>,
            )
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                ...toAuthPhonePayload(phone),
                password,
            }

            const response = await apiSignIn(payload)
            const token = response.token

            if (!token) {
                throw new Error('Токен авторизации не получен')
            }

            // Подменяем токен, получаем профиль пользователя и сохраняем его в избранные
            setToken(token)
            const newUser = await apiGetCurrentUser()
            addFavoriteAccount(newUser, token)

            toast.push(
                <Notification title="Успешно" type="success">
                    Аккаунт добавлен и активирован
                </Notification>,
            )

            onClose()
            window.location.href = '/home'
        } catch (err: unknown) {
            toast.push(
                <Notification title="Ошибка входа" type="danger">
                    Неверный логин или пароль
                </Notification>,
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        if (isLoading) return
        setPhone('')
        setPassword('')
        onClose()
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            onRequestClose={handleClose}
            width={420}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                        <TbUserPlus className="text-2xl" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Добавить аккаунт в избранные
                        </h4>
                        <p className="text-xs text-gray-500">
                            Введите логин и пароль для входа и сохранения аккаунта
                        </p>
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        <TbPhone className="text-sm" />
                        Телефон
                    </label>
                    <PhoneInput
                        value={phone}
                        disabled={isLoading}
                        onChange={(val) => setPhone(val)}
                    />
                </div>

                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        <TbLock className="text-sm" />
                        Пароль
                    </label>
                    <PasswordInput
                        value={password}
                        disabled={isLoading}
                        placeholder="Введите пароль"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        disabled={isLoading}
                        onClick={handleClose}
                    >
                        Отмена
                    </Button>
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isLoading}
                    >
                        Войти и сохранить
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default SwitchAccountDialog
