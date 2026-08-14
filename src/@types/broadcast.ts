import type { UserLogRaw } from '@/@types/notification'

export type UserLogsCreatedBroadcastPayload = {
    log?: UserLogRaw
    user_log?: UserLogRaw
} & Partial<UserLogRaw>

export type UserLogsReadedBroadcastPayload = {
    ids?: number[]
    log_ids?: number[]
    user_log_ids?: number[]
}
