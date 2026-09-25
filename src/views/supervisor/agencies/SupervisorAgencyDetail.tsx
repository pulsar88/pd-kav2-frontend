import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import DataTable from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import type { ColumnDef } from '@/components/shared/DataTable'
import {
    apiGetAgency,
    apiToggleAgencyActivate,
} from '@/services/AgencyService'
import {
    apiMakeUserAgencySupervisor,
    apiToggleUserBlock,
} from '@/services/UsersService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    AGENCY_SUPERVISOR,
    getUserRoleLabel,
} from '@/constants/roles.constant'
import { formatRuPhone } from '@/views/fixations/utils'
import type { AgencyItem, AgencyAgent } from '@/@types/agency'
import type { AdminUserListItem } from '@/@types/users'
import ChangeUserAgencyDialog from '../components/ChangeUserAgencyDialog'
import { HiOutlineUser } from 'react-icons/hi'
import {
    TbArrowLeft,
    TbBuilding,
    TbCircleCheck,
    TbCircleX,
    TbClock,
    TbLock,
    TbLockOpen,
    TbMail,
    TbPhone,
    TbPower,
    TbUser,
    TbUserCheck,
    TbUsers,
} from 'react-icons/tb'
import { Tooltip } from '@/components/ui'

const isAgencyActive = (agency: AgencyItem): boolean =>
    Boolean(agency.active === 1 || agency.active === true)

const isAgentBlocked = (agent: AgencyAgent): boolean =>
    Boolean(
        (agent as any).blocked === 1 ||
            (agent as any).blocked === true ||
            (agent as any).is_blocked === 1,
    )

const SupervisorAgencyDetail = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [agency, setAgency] = useState<AgencyItem | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Действия с агентством
    const [isTogglingAgencyActive, setIsTogglingAgencyActive] = useState(false)
    const [isAgencyConfirmOpen, setIsAgencyConfirmOpen] = useState(false)

    // Действия с пользователями (агентами / руком)
    const [selectedUserForAgencyChange, setSelectedUserForAgencyChange] =
        useState<AdminUserListItem | null>(null)
    const [supervisorTarget, setSupervisorTarget] =
        useState<AgencyAgent | null>(null)
    const [blockTarget, setBlockTarget] = useState<AgencyAgent | null>(null)

    const [isMakingSupervisor, setIsMakingSupervisor] = useState(false)
    const [isTogglingBlock, setIsTogglingBlock] = useState(false)

    const loadAgencyDetails = useCallback(async () => {
        if (!id) return
        setIsLoading(true)
        try {
            const data = await apiGetAgency(id, {
                with: 'supervisor,agents,agents.profilePicture',
            })
            setAgency(data)
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось загрузить данные агентства',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        void loadAgencyDetails()
    }, [loadAgencyDetails])

    const handleToggleAgencyActive = async () => {
        if (!agency) return
        const active = isAgencyActive(agency)
        setIsTogglingAgencyActive(true)
        try {
            await apiToggleAgencyActivate(agency.id)
            toast.push(
                <Notification type={active ? 'warning' : 'success'}>
                    Агентство «{agency.name}»{' '}
                    {active ? 'деактивировано' : 'активировано'}
                </Notification>,
                { placement: 'top-center' },
            )
            setIsAgencyConfirmOpen(false)
            void loadAgencyDetails()
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        active
                            ? 'Не удалось деактивировать агентство'
                            : 'Не удалось активировать агентство',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsTogglingAgencyActive(false)
        }
    }

    const handleConfirmMakeSupervisor = async () => {
        if (!supervisorTarget || !agency) return

        setIsMakingSupervisor(true)
        try {
            await apiMakeUserAgencySupervisor(supervisorTarget.id)
            toast.push(
                <Notification type="success">
                    «{supervisorTarget.name}» назначен руководителем агентства
                    «{agency.name}»
                </Notification>,
                { placement: 'top-center' },
            )
            setSupervisorTarget(null)
            void loadAgencyDetails()
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

        const blocked = isAgentBlocked(blockTarget)
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
            void loadAgencyDetails()
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

    // Собираем всех пользователей агентства (агентов + руководителя)
    const combinedAgents = useMemo(() => {
        if (!agency) return []
        const list: AgencyAgent[] = [...(agency.agents || [])]

        if (agency.supervisor) {
            const supervisorExists = list.some(
                (a) => a.id === agency.supervisor?.id,
            )
            if (!supervisorExists) {
                list.unshift({
                    id: agency.supervisor.id,
                    name: agency.supervisor.name,
                    email: agency.supervisor.email,
                    phone: agency.supervisor.phone,
                    country_code: agency.supervisor.country_code,
                    roles: agency.supervisor.roles || [AGENCY_SUPERVISOR],
                    access_level: agency.supervisor.access_level,
                    access_level_expires_at:
                        agency.supervisor.access_level_expires_at,
                    bonuses: agency.supervisor.bonuses,
                    profile_picture: agency.supervisor.profile_picture,
                    blocked: agency.supervisor.blocked,
                } as any)
            }
        }
        return list
    }, [agency])

    const agentColumns: ColumnDef<AgencyAgent>[] = useMemo(
        () => [
            {
                header: 'Пользователь',
                accessorKey: 'name',
                enableSorting: false,
                cell: ({ row }) => {
                    const agent = row.original
                    const blocked = isAgentBlocked(agent)
                    const isSupervisor = agency?.supervisor?.id === agent.id
                    const avatarSrc =
                        agent.profile_picture?.src ||
                        agent.profile_picture?.url_path ||
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
                                        {agent.name || '—'}
                                    </p>
                                    {isSupervisor ? (
                                        <Tag className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 leading-none">
                                            Руководитель
                                        </Tag>
                                    ) : null}
                                    {blocked ? (
                                        <Tag className="border-0 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.5 leading-none">
                                            Заблокирован
                                        </Tag>
                                    ) : null}
                                </div>
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                    {agent.email || 'Email не указан'}
                                </p>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Телефон',
                accessorKey: 'phone',
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm tabular-nums">
                        {row.original.phone
                            ? formatRuPhone(row.original.phone)
                            : '—'}
                    </span>
                ),
            },
            {
                header: 'Роль / уровень',
                id: 'role',
                enableSorting: false,
                cell: ({ row }) => {
                    const agent = row.original
                    const role = getUserRoleLabel(agent.roles?.[0] || 'agent')
                    const level = agent.access_level?.name
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
                enableSorting: false,
                cell: ({ row }) => {
                    const agent = row.original
                    const blocked = isAgentBlocked(agent)
                    const isCurrentSupervisor =
                        agency?.supervisor?.id === agent.id

                    const adminUserItem: AdminUserListItem = {
                        id: agent.id,
                        name: agent.name,
                        email: agent.email ?? null,
                        phone: agent.phone,
                        agency: agency
                            ? { id: agency.id, name: agency.name }
                            : null,
                    }

                    return (
                        <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Сменить агентство */}
                            <Tooltip title="Сменить агентство">
                                <Button
                                    size="xs"
                                    variant="solid"
                                    shape="circle"
                                    icon={<TbBuilding />}
                                    aria-label="Сменить агентство"
                                    onClick={() =>
                                        setSelectedUserForAgencyChange(
                                            adminUserItem,
                                        )
                                    }
                                />
                            </Tooltip>

                            {/* Назначить руководителем агентства */}
                            {!isCurrentSupervisor ? (
                                <Tooltip title="Назначить руководителем агентства">
                                    <Button
                                        size="xs"
                                        variant="solid"
                                        shape="circle"
                                        icon={<TbUserCheck />}
                                        aria-label="Назначить руководителем агентства"
                                        onClick={() =>
                                            setSupervisorTarget(agent)
                                        }
                                    />
                                </Tooltip>
                            ) : null}

                            {/* Заблокировать / разблокировать */}
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
                                    onClick={() => setBlockTarget(agent)}
                                />
                            </Tooltip>
                        </div>
                    )
                },
            },
        ],
        [agency],
    )

    if (isLoading) {
        return (
            <Container>
                <div className="flex min-h-[400px] items-center justify-center">
                    <Spinner size={40} />
                </div>
            </Container>
        )
    }

    if (!agency) {
        return (
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <TbBuilding className="text-5xl text-gray-400 mb-3" />
                        <h4 className="text-lg font-bold mb-1">
                            Агентство не найдено
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                            Возможно, агентство было удалено или перемещено.
                        </p>
                        <Button
                            variant="default"
                            icon={<TbArrowLeft />}
                            onClick={() => navigate('/supervisor/agencies')}
                        >
                            Все агентства
                        </Button>
                    </div>
                </AdaptiveCard>
            </Container>
        )
    }

    const active = isAgencyActive(agency)
    const isBlockTargetBlocked = Boolean(
        blockTarget && isAgentBlocked(blockTarget),
    )

    return (
        <Container>
            <div className="flex flex-col gap-6">
                {/* Навигация назад (кнопка с фоном) */}
                <div>
                    <Button
                        variant="default"
                        size="sm"
                        icon={<TbArrowLeft />}
                        onClick={() => navigate('/supervisor/agencies')}
                    >
                        Все агентства
                    </Button>
                </div>

                {/* Основная карточка агентства */}
                <AdaptiveCard>
                    <div className="flex flex-col gap-6">
                        {/* Верхняя строка: Название, статус, агрегатор и кнопка активации/деактивации на месте бывших счетчиков */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-start sm:items-center gap-4">
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl text-primary">
                                    <TbBuilding />
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100">
                                            {agency.name}
                                        </h3>
                                        <Tag
                                            className={`border-0 font-medium ${
                                                active
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1">
                                                {active ? (
                                                    <TbCircleCheck className="text-sm" />
                                                ) : (
                                                    <TbCircleX className="text-sm" />
                                                )}
                                                {active ? 'Активно' : 'Неактивно'}
                                            </span>
                                        </Tag>
                                        {agency.is_aggregator ? (
                                            <Tag className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-bold">
                                                Агрегатор
                                            </Tag>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        ID агентства: #{agency.id}
                                    </p>
                                </div>
                            </div>

                            {/* Кнопка активации / деактивации на месте счетчиков */}
                            <div className="shrink-0">
                                <Button
                                    variant="solid"
                                    size="sm"
                                    className={
                                        active
                                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }
                                    icon={<TbPower />}
                                    onClick={() => setIsAgencyConfirmOpen(true)}
                                >
                                    {active
                                        ? 'Деактивировать агентство'
                                        : 'Активировать агентство'}
                                </Button>
                            </div>
                        </div>

                        {/* Сетка информационных блоков: Руководитель (слева) + Срок фиксации и Кол-во агентов (справа) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Блок руководителя (занимает левую часть на десктопе, растягивается на мобилке) */}
                            <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                <div>
                                    <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Руководитель агентства
                                    </h5>

                                    {agency.supervisor ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                size={44}
                                                shape="circle"
                                                src={
                                                    agency.supervisor.profile_picture
                                                        ?.src || undefined
                                                }
                                                icon={<HiOutlineUser />}
                                                className="shrink-0 bg-primary/10 text-primary"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base truncate">
                                                    {agency.supervisor.name}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {agency.supervisor.phone ? (
                                                        <span className="flex items-center gap-1 tabular-nums">
                                                            <TbPhone className="text-gray-400" />
                                                            {formatRuPhone(
                                                                agency.supervisor.phone,
                                                            )}
                                                        </span>
                                                    ) : null}
                                                    {agency.supervisor.email ? (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <TbMail className="text-gray-400" />
                                                            {agency.supervisor.email}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-2 text-center sm:text-left">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Руководитель не назначен
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Назначьте руководителя из списка агентов ниже
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {agency.supervisor ? (
                                    <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-end">
                                        <Tooltip
                                            title={
                                                isAgentBlocked(
                                                    agency.supervisor as any,
                                                )
                                                    ? 'Разблокировать руководителя'
                                                    : 'Заблокировать руководителя'
                                            }
                                        >
                                            <Button
                                                size="xs"
                                                variant="solid"
                                                className={
                                                    isAgentBlocked(
                                                        agency.supervisor as any,
                                                    )
                                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                                                }
                                                icon={
                                                    isAgentBlocked(
                                                        agency.supervisor as any,
                                                    ) ? (
                                                        <TbLock />
                                                    ) : (
                                                        <TbLockOpen />
                                                    )
                                                }
                                                onClick={() =>
                                                    setBlockTarget(
                                                        agency.supervisor as any,
                                                    )
                                                }
                                            >
                                                {isAgentBlocked(
                                                    agency.supervisor as any,
                                                )
                                                    ? 'Разблокировать'
                                                    : 'Заблокировать'}
                                            </Button>
                                        </Tooltip>
                                    </div>
                                ) : null}
                            </div>

                            {/* Блок срока фиксации (справа от рука) */}
                            <div className="lg:col-span-3 flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                <div>
                                    <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Срок фиксации
                                    </h5>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl">
                                            <TbClock />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {agency.fix_days
                                                    ? `${agency.fix_days} дн.`
                                                    : '—'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Дней закрепления
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Блок количества агентов (справа от рука) */}
                            <div className="lg:col-span-3 flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                <div>
                                    <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Всего агентов
                                    </h5>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl">
                                            <TbUsers />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {combinedAgents.length}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                В штате агентства
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AdaptiveCard>

                {/* Таблица агентов агентства */}
                <AdaptiveCard>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-gray-100">
                                    Агенты агентства
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Список всех агентов, состоящих в агентстве
                                </p>
                            </div>
                            <Tag className="border-0 bg-primary/10 text-primary font-bold">
                                {combinedAgents.length} агентов
                            </Tag>
                        </div>

                        <DataTable
                            columns={agentColumns}
                            data={combinedAgents}
                            loading={false}
                            noData={combinedAgents.length === 0}
                        />
                    </div>
                </AdaptiveCard>
            </div>

            {/* Модалка смены агентства пользователю */}
            <ChangeUserAgencyDialog
                isOpen={Boolean(selectedUserForAgencyChange)}
                user={selectedUserForAgencyChange}
                onClose={() => setSelectedUserForAgencyChange(null)}
                onSuccess={() => {
                    setSelectedUserForAgencyChange(null)
                    void loadAgencyDetails()
                }}
            />

            {/* Подтверждение активации/деактивации агентства */}
            <ConfirmDialog
                isOpen={isAgencyConfirmOpen}
                type={active ? 'danger' : 'info'}
                title={
                    active
                        ? 'Деактивировать агентство?'
                        : 'Активировать агентство?'
                }
                confirmText={active ? 'Деактивировать' : 'Активировать'}
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: isTogglingAgencyActive,
                    disabled: isTogglingAgencyActive,
                    className: active
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white',
                }}
                onCancel={() => {
                    if (!isTogglingAgencyActive) setIsAgencyConfirmOpen(false)
                }}
                onClose={() => {
                    if (!isTogglingAgencyActive) setIsAgencyConfirmOpen(false)
                }}
                onConfirm={() => {
                    void handleToggleAgencyActive()
                }}
            >
                <p>
                    {active
                        ? `Вы уверены, что хотите деактивировать агентство «${agency.name}»? Агенты временно не смогут создавать новые фиксации.`
                        : `Активировать агентство «${agency.name}»? Агентам снова будет доступна работа с объектами и фиксациями.`}
                </p>
            </ConfirmDialog>

            {/* Подтверждение назначения руководителем */}
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
                    «{agency.name}»?
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Текущий руководитель этого агентства станет обычным агентом.
                </p>
            </ConfirmDialog>

            {/* Подтверждение бана / разбана пользователя */}
            <ConfirmDialog
                isOpen={Boolean(blockTarget)}
                type={isBlockTargetBlocked ? 'info' : 'danger'}
                title={
                    isBlockTargetBlocked
                        ? 'Разблокировать пользователя?'
                        : 'Заблокировать пользователя?'
                }
                confirmText={
                    isBlockTargetBlocked ? 'Разблокировать' : 'Заблокировать'
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

export default SupervisorAgencyDetail
