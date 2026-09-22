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
} from '@/services/UsersService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    AGENCY_SUPERVISOR,
    getUserRoleLabel,
} from '@/constants/roles.constant'
import { formatRuPhone } from '@/views/fixations/utils'
import type { AdminUserListItem } from '@/@types/users'
import ChangeUserAgencyDialog from './components/ChangeUserAgencyDialog'
import { HiOutlineUser } from 'react-icons/hi'
import {
    TbBuilding,
    TbRefresh,
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

const SupervisorUsers = () => {
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
    const [isMakingSupervisor, setIsMakingSupervisor] = useState(false)

    const loadUsers = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await apiGetUsers({
                page: pageIndex,
                per_page: PAGE_SIZE,
                search: search || undefined,
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
    }, [pageIndex, search])

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

    const columns: ColumnDef<AdminUserListItem>[] = useMemo(
        () => [
            {
                header: 'Пользователь',
                accessorKey: 'name',
                cell: ({ row }) => {
                    const user = row.original
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
                                <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                    {user.name || '—'}
                                </p>
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
                    return (
                        <div className="flex items-center gap-1">
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

                            {canMakeAgencySupervisor(user) ? (
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
                        </div>
                    )
                },
            },
        ],
        [],
    )

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="mb-1 flex items-center gap-2">
                                <TbUsers className="shrink-0 text-primary" />
                                Пользователи
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Список пользователей системы
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
        </Container>
    )
}

export default SupervisorUsers
