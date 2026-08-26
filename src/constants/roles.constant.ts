export const ADMIN = 'admin'
export const USER = 'user'
export const AGENT = 'agent'
export const AGENCY_SUPERVISOR = 'agency-supervisor'
export const SUPERVISOR = 'supervisor'
export const CONTENT_MANAGER = 'content-manager'

export type UserRole =
    | typeof ADMIN
    | typeof USER
    | typeof AGENT
    | typeof AGENCY_SUPERVISOR
    | typeof SUPERVISOR
    | typeof CONTENT_MANAGER
    | string

/** Роли с доступом к кабинету агента (без контент-менеджера) */
export const AGENT_CABINET_ROLES = [
    ADMIN,
    USER,
    AGENT,
    AGENCY_SUPERVISOR,
    SUPERVISOR,
] as const

/** Профиль и контент (помощь, новости, события) — доступны и контент-менеджеру */
export const CONTENT_MANAGER_ALLOWED_ROLES = [
    ...AGENT_CABINET_ROLES,
    CONTENT_MANAGER,
] as const

export const roleLabels: Record<string, string> = {
    [ADMIN]: 'Администратор',
    [AGENT]: 'Агент',
    [AGENCY_SUPERVISOR]: 'Руководитель агентства',
    [SUPERVISOR]: 'Супервайзер',
    [CONTENT_MANAGER]: 'Контент-менеджер',
    [USER]: 'Пользователь',
}

export const getUserRoleLabel = (role?: string | null): string => {
    if (!role) return '—'
    return roleLabels[role] ?? role
}

export const hasAgentCabinetAccess = (authority: string[] = []) =>
    authority.some((role) =>
        (AGENT_CABINET_ROLES as readonly string[]).includes(role),
    )

export const isContentManagerOnly = (authority: string[] = []) =>
    authority.includes(CONTENT_MANAGER) && !hasAgentCabinetAccess(authority)

export const CONTENT_MANAGER_ENTRY_PATH = '/news'

export const getAuthenticatedEntryPath = (
    authority: string[] = [],
    fallback = '/home',
) => (isContentManagerOnly(authority) ? CONTENT_MANAGER_ENTRY_PATH : fallback)