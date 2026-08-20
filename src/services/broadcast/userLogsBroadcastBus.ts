import type { UserLog } from '@/@types/notification'

export type UserLogsBroadcastHandlers = {
    onLogCreated?: (log: UserLog) => void
    onLogsReaded?: (ids: number[]) => void
    onLogsSynced?: () => void
}

const handlers = new Set<UserLogsBroadcastHandlers>()

export const registerUserLogsBroadcastHandlers = (
    nextHandlers: UserLogsBroadcastHandlers,
) => {
    handlers.add(nextHandlers)

    return () => {
        handlers.delete(nextHandlers)
    }
}

export const emitUserLogCreated = (log: UserLog) => {
    handlers.forEach((handler) => handler.onLogCreated?.(log))
}

export const emitUserLogsReaded = (ids: number[]) => {
    handlers.forEach((handler) => handler.onLogsReaded?.(ids))
}

export const emitUserLogsSynced = () => {
    handlers.forEach((handler) => handler.onLogsSynced?.())
}
