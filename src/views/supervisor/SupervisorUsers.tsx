import { useCallback, useEffect, useMemo, useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import DataTable from '@/components/shared/DataTable'
import DebouceInput from '@/components/shared/DebouceInput'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import type { ColumnDef } from '@/components/shared/DataTable'
import {
    apiGetUsers,
    apiMakeUserAgencySupervisor,
    apiToggleUserBlock,
} from '@/services/UsersService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    ADMIN,
    SUPERVISOR,
    AGENCY_SUPERVISOR,
    getUserRoleLabel,
} from '@/constants/roles.constant'
import { useSessionUser } from '@/store/authStore'
import { formatRuPhone } from '@/views/fixations/utils'
import type { AdminUserListItem } from '@/@types/users'
import ChangeUserAgencyDialog from './components/ChangeUserAgencyDialog'
import { HiOutlineUser } from 'react-icons/hi'
import {
    TbBuilding,
    TbLock,
    TbLockOpen,
    TbSearch,
    TbUserCheck,
    TbUsers,
} from 'react-icons/tb'
import type { ChangeEvent } from 'react'
import { Tooltip } from '@/components/ui'

const PAGE_SIZE = 20

const canMakeAgencySupervisor = (user: AdminUserListItem) => {
    if (!user.agency?.id) return false
    return !(user.roles ?? []).includes(AGENCY_SUPERVISOR)
}

const isUserBlocked = (user: AdminUserListItem): boolean =>
    Boolean(user.blocked === 1 || user.blocked === true)

const SupervisorUsers = () => {
    const currentUser = useSessionUser((state) => state.user)
    const authority = currentUser.authority ?? []

    // Глобальный супервайзер/админ видит всех и может менять агентство
    const isGlobalSupervisor =
        authority.includes(SUPERVISOR) || authority.includes(ADMIN)

    // Руководитель агентства (agency-supervisor / supervisor_agent)
    const isAgencySupervisor =
        !isGlobalSupervisor &&
        (authority.includes(AGENCY_SUPERVISOR) ||
            authority.includes('supervisor_agent'))

    // ID агентства текущего руководителя
    const agencyId = isAgencySupervisor
        ? currentUser.agency?.id ?? undefined
        : undefined

    const [users, setUsers] = useState<AdminUserListItem[]>([])
    const [total, setTotal] = useState(0)
    const [pageIndex, setPageIndex] = useState(1)
    const [search, setSearch] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(
        null,
    )
    const [supervisorTarget, setSupervisorTarget] =
        useState<AdminUserListItem | null>(null)
    const [blockTarget, setBlockTarget] = useState<AdminUserListItem | null>(
        null,
    )
    const [isMakingSupervisor, setIsMakingSupervisor] = useState(false)
    const [isTogglingBlock, setIsTogglingBlock] = useState(false)

    const loadUsers = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await apiGetUsers({
                page: pageIndex,
                per_page: PAGE_SIZE,
                search: search || undefined,
                agency_id: agencyId,
            })
            setUsers(response.data)
            setTotal(response.meta?.total ?? response.data.length)
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось загрузить список пользователей',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
            setUsers([])
            setTotal(0)
        } finally {
            setIsLoading(false)
        }
    }, [pageIndex, search, agencyId])

    useEffect(() => {
        void loadUsers()
    }, [loadUsers])

    const handleSearchChange = (value: string) => {
        setPageIndex(1)
        setSearch(value.trim())
    }

    const handleConfirmMakeSupervisor = async () => {
        if (!supervisorTarget) return

        setIsMakingSupervisor(true)
        try {
            await apiMakeUserAgencySupervisor(supervisorTarget.id)
            toast.push(
                <Notification type="success">
                    «{supervisorTarget.name}» назначен руководителем агентства
                    «{supervisorTarget.agency?.name || ''}»
                </Notification>,
                { placement: 'top-center' },
            )
            setSupervisorTarget(null)
            void loadUsers()
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось назначить руководителя агентства',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsMakingSupervisor(false)
        }
    }

    const handleConfirmToggleBlock = async () => {
        if (!blockTarget) return

        const blocked = isUserBlocked(blockTarget)
        setIsTogglingBlock(true)
        try {
            await apiToggleUserBlock(blockTarget.id)
            toast.push(
                <Notification type={blocked ? 'success' : 'warning'}>
                    Пользователь «{blockTarget.name}»{' '}
                    {blocked ? 'разблокирован' : 'заблокирован'}
                </Notification>,
                { placement: 'top-center' },
            )
            setBlockTarget(null)
            void loadUsers()
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        blocked
                            ? 'Не удалось разблокировать пользователя'
                            : 'Не удалось заблокировать пользователя',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsTogglingBlock(false)
        }
    }

    const columns: ColumnDef<AdminUserListItem>[] = useMemo(
        () => [
            {
                header: 'Пользователь',
                accessorKey: 'name',
                cell: ({ row }) => {
                    const user = row.original
                    const blocked = isUserBlocked(user)
                    const avatarSrc =
                        user.profile_picture?.src ||
                        user.profile_picture?.url_path ||
                        ''
                    return (
                        <div className="flex min-w-0 items-center gap-3">
                            <Avatar
                                size={40}
                                shape="circle"
                                src={avatarSrc || undefined}
                                icon={<HiOutlineUser />}
                                className="shrink-0 bg-gray-100 text-gray-400 dark:bg-gray-700"
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                        {user.name || '—'}
                                    </p>
                                    {blocked ? (
                                        <Tag className="border-0 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.5 leading-none">
                                            Заблокирован
                                        </Tag>
                                    ) : null}
                                </div>
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                    {user.email || 'Email не указан'}
                                </p>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Телефон',
                accessorKey: 'phone',
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm tabular-nums">
                        {row.original.phone
                            ? formatRuPhone(row.original.phone)
                            : '—'}
                    </span>
                ),
            },
            {
                header: 'Агентство',
                id: 'agency',
                cell: ({ row }) => {
                    const agencyName = row.original.agency?.name
                    return agencyName ? (
                        <span className="inline-flex max-w-[14rem] items-center gap-1.5 truncate text-sm">
                            <TbBuilding className="shrink-0 text-gray-400" />
                            <span className="truncate">{agencyName}</span>
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400">Нет</span>
                    )
                },
            },
            {
                header: 'Роль / уровень',
                id: 'role',
                cell: ({ row }) => {
                    const role = getUserRoleLabel(row.original.roles?.[0])
                    const level = row.original.access_level?.name
                    return (
                        <div className="flex min-w-0 flex-col gap-1">
                            <Tag className="w-fit border-0 bg-primary-subtle text-primary">
                                {role}
                            </Tag>
                            {level ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {level}
                                </span>
                            ) : null}
                        </div>
                    )
                },
            },
            {
                header: 'Действия',
                id: 'actions',
                cell: ({ row }) => {
                    const user = row.original
                    const blocked = isUserBlocked(user)
                    const isSelf = String(user.id) === String(currentUser.userId)

                    return (
                        <div className="flex items-center gap-1">
                            {/* Смена агентства доступна только глобальному супервайзеру/админу */}
                            {isGlobalSupervisor ? (
                                <Tooltip title="Сменить агентство">
                                    <Button
                                        size="xs"
                                        variant="solid"
                                        shape="circle"
                                        icon={<TbBuilding />}
                                        aria-label="Сменить агентство"
                                        onClick={() => setSelectedUser(user)}
                                    />
                                </Tooltip>
                            ) : null}

                            {/* Назначить руководителем агентства доступно только глобальному супервайзеру/админу */}
                            {isGlobalSupervisor && canMakeAgencySupervisor(user) ? (
                                <Tooltip title="Назначить руководителем агентства">
                                    <Button
                                        size="xs"
                                        variant="solid"
                                        shape="circle"
                                        icon={<TbUserCheck />}
                                        aria-label="Назначить руководителем агентства"
                                        onClick={() => setSupervisorTarget(user)}
                                    />
                                </Tooltip>
                            ) : null}

                            {/* Заблокировать/разблокировать доступно ТОЛЬКО глобальному супервайзеру/админу (не самого себя) */}
                            {isGlobalSupervisor && !isSelf ? (
                                <Tooltip
                                    title={
                                        blocked
                                            ? 'Разблокировать пользователя'
                                            : 'Заблокировать пользователя'
                                    }
                                >
                                    <Button
                                        size="xs"
                                        variant="solid"
                                        shape="circle"
                                        className={
                                            blocked
                                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                                        }
                                        icon={
                                            blocked ? <TbLock /> : <TbLockOpen />
                                        }
                                        aria-label={
                                            blocked
                                                ? 'Разблокировать'
                                                : 'Заблокировать'
                                        }
                                        onClick={() => setBlockTarget(user)}
                                    />
                                </Tooltip>
                            ) : null}
                        </div>
                    )
                },
            },
        ],
        [isGlobalSupervisor, currentUser.userId],
    )

    const isBlockTargetBlocked = Boolean(
        blockTarget && isUserBlocked(blockTarget),
    )

    const agencySubtitle = isAgencySupervisor && currentUser.agencyName
        ? `Список агентов агентства «${currentUser.agencyName}»`
        : 'Список пользователей системы'

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="mb-1 flex items-center gap-2">
                                <TbUsers className="shrink-0 text-primary" />
                                {isAgencySupervisor ? 'Агенты' : 'Пользователи'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {agencySubtitle}
                            </p>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <DebouceInput
                            wait={900}
                            placeholder="Поиск по имени, email или телефону..."
                            suffix={<TbSearch className="text-lg" />}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSearchChange(e.target.value)
                            }
                        />
                    </div>

                    <DataTable
                        columns={columns}
                        data={users}
                        loading={isLoading}
                        noData={!isLoading && users.length === 0}
                        pagingData={{
                            total,
                            pageIndex,
                            pageSize: PAGE_SIZE,
                        }}
                        onPaginationChange={setPageIndex}
                    />
                </div>
            </AdaptiveCard>

            <ChangeUserAgencyDialog
                isOpen={Boolean(selectedUser)}
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onSuccess={() => {
                    setSelectedUser(null)
                    void loadUsers()
                }}
            />

            <ConfirmDialog
                isOpen={Boolean(supervisorTarget)}
                type="warning"
                title="Назначить руководителем?"
                confirmText="Назначить"
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: isMakingSupervisor,
                    disabled: isMakingSupervisor,
                }}
                onCancel={() => {
                    if (!isMakingSupervisor) setSupervisorTarget(null)
                }}
                onClose={() => {
                    if (!isMakingSupervisor) setSupervisorTarget(null)
                }}
                onConfirm={() => {
                    void handleConfirmMakeSupervisor()
                }}
            >
                <p>
                    Назначить «{supervisorTarget?.name}» руководителем агентства
                    «{supervisorTarget?.agency?.name}»?
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Текущий руководитель этого агентства станет агентом.
                </p>
            </ConfirmDialog>

            <ConfirmDialog
                isOpen={Boolean(blockTarget)}
                type={isBlockTargetBlocked ? 'info' : 'danger'}
                title={
                    isBlockTargetBlocked
                        ? 'Разблокировать пользователя?'
                        : 'Заблокировать пользователя?'
                }
                confirmText={
                    isBlockTargetBlocked
                        ? 'Разблокировать'
                        : 'Заблокировать'
                }
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: isTogglingBlock,
                    disabled: isTogglingBlock,
                    className: isBlockTargetBlocked
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white',
                }}
                onCancel={() => {
                    if (!isTogglingBlock) setBlockTarget(null)
                }}
                onClose={() => {
                    if (!isTogglingBlock) setBlockTarget(null)
                }}
                onConfirm={() => {
                    void handleConfirmToggleBlock()
                }}
            >
                <p>
                    {isBlockTargetBlocked
                        ? `Разблокировать пользователя «${blockTarget?.name}»? Он снова сможет войти в систему.`
                        : `Вы уверены, что хотите заблокировать пользователя «${blockTarget?.name}»? Его сессия будет прекращена, а доступ в систему ограничен.`}
                </p>
            </ConfirmDialog>
        </Container>
    )
}

export default SupervisorUsers
