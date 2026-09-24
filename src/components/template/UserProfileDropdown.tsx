import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useSessionUser, useToken } from '@/store/authStore'
import { useSavedAccountsStore, type SavedAccount } from '@/store/savedAccountsStore'
import { Link, useNavigate } from 'react-router'
import {
    PiUserDuotone,
    PiSignOutDuotone,
    PiUserPlusDuotone,
    PiTrashSimpleDuotone,
} from 'react-icons/pi'
import { useAuth } from '@/auth'
import { SUPERVISOR, CONTENT_MANAGER } from '@/constants/roles.constant'
import type { JSX, MouseEvent } from 'react'

type DropdownList = {
    label: string
    path: string
    icon: JSX.Element
}

const dropdownItemList: DropdownList[] = [
    {
        label: 'Профиль',
        path: '/account/profile',
        icon: <PiUserDuotone />,
    },
]

const _UserDropdown = () => {
    const user = useSessionUser((state) => state.user)
    const { avatar, userName, email, userId, phone, authority = [] } = user
    const { setToken } = useToken()
    const { signOut } = useAuth()
    const navigate = useNavigate()

    const isPrivileged =
        authority.includes(SUPERVISOR) || authority.includes(CONTENT_MANAGER)

    const accounts = useSavedAccountsStore((state) => state.accounts)
    const removeAccount = useSavedAccountsStore((state) => state.removeAccount)

    const handleSignOut = () => {
        if (userId) {
            removeAccount(userId)
        }
        signOut()
    }

    const handleSwitchAccount = (account: SavedAccount) => {
        if (account.userId === userId) return
        setToken(account.token)
        window.location.href = '/account/profile'
    }

    const handleAddAccount = () => {
        // Очищаем текущую сессию в памяти, сохраняя аккаунт в списке сохраненных,
        // и переходим на страницу логина для входа под вторым аккаунтом
        setToken('')
        useSessionUser.getState().setUser({})
        useSessionUser.getState().setSessionSignedIn(false)
        navigate('/sign-in')
    }

    const handleRemoveAccount = (e: MouseEvent, targetUserId: string) => {
        e.preventDefault()
        e.stopPropagation()
        removeAccount(targetUserId)
    }

    const avatarProps = {
        ...(avatar ? { src: avatar } : { icon: <PiUserDuotone /> }),
    }

    const otherAccounts = isPrivileged
        ? accounts.filter((acc) => acc.userId !== userId)
        : []

    return (
        <Dropdown
            className="flex"
            toggleClassName="flex items-center"
            menuClass="w-72 max-w-[calc(100vw-2rem)]"
            renderTitle={
                <div className="cursor-pointer flex items-center">
                    <Avatar size={32} {...avatarProps} />
                </div>
            }
            placement="bottom-end"
        >
            <Dropdown.Item variant="header">
                <div className="flex min-w-0 items-center gap-3 px-3 py-2">
                    <Avatar className="shrink-0" {...avatarProps} />
                    <div className="min-w-0 flex-1">
                        <div
                            className="truncate font-bold text-gray-900 dark:text-gray-100"
                            title={userName || undefined}
                        >
                            {userName || 'Anonymous'}
                        </div>
                        <div
                            className="truncate text-xs text-gray-500"
                            title={phone || email || undefined}
                        >
                            {phone || email || 'Аккаунт'}
                        </div>
                    </div>
                </div>
            </Dropdown.Item>

            {isPrivileged && otherAccounts.length > 0 ? (
                <>
                    <Dropdown.Item variant="divider" />
                    <Dropdown.Item variant="header">
                        <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Другие аккаунты
                        </div>
                    </Dropdown.Item>
                    {otherAccounts.map((acc) => (
                        <Dropdown.Item
                            key={acc.userId}
                            className="px-2 py-1.5"
                            onClick={() => handleSwitchAccount(acc)}
                        >
                            <div className="flex w-full items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <Avatar
                                        size={28}
                                        {...(acc.avatar
                                            ? { src: acc.avatar }
                                            : { icon: <PiUserDuotone /> })}
                                    />
                                    <div className="min-w-0">
                                        <div className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
                                            {acc.userName}
                                        </div>
                                        <div className="truncate text-[11px] text-gray-400">
                                            {acc.phone || acc.agencyName || 'Переключиться'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="p-1 text-gray-400 hover:text-rose-500 rounded"
                                    title="Удалить из списка"
                                    onClick={(e) => handleRemoveAccount(e, acc.userId)}
                                >
                                    <PiTrashSimpleDuotone className="text-sm" />
                                </button>
                            </div>
                        </Dropdown.Item>
                    ))}
                </>
            ) : null}

            {isPrivileged ? (
                <Dropdown.Item
                    className="gap-2 text-primary hover:text-primary"
                    onClick={handleAddAccount}
                >
                    <span className="text-xl">
                        <PiUserPlusDuotone />
                    </span>
                    <span className="text-sm font-medium">Добавить аккаунт</span>
                </Dropdown.Item>
            ) : null}

            <Dropdown.Item variant="divider" />

            {dropdownItemList.map((item) => (
                <Dropdown.Item
                    key={item.label}
                    eventKey={item.label}
                    className="px-0"
                >
                    <Link className="flex h-full w-full px-2" to={item.path}>
                        <span className="flex gap-2 items-center w-full">
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </span>
                    </Link>
                </Dropdown.Item>
            ))}

            <Dropdown.Item
                eventKey="Sign Out"
                className="gap-2 text-rose-600 hover:text-rose-700"
                onClick={handleSignOut}
            >
                <span className="text-xl">
                    <PiSignOutDuotone />
                </span>
                <span>Выйти</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)

export default UserDropdown
