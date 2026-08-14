import Avatar from '@/components/ui/Avatar'
import classNames from '@/utils/classNames'
import { isSystemNotificationType } from '@/views/notifications/utils'
import type { NotificationType } from '@/@types/notification'
import {
    TbBell,
    TbBriefcase,
    TbBuilding,
    TbFileText,
    TbUser,
} from 'react-icons/tb'

const iconByCode: Record<string, typeof TbBell> = {
    agency: TbBuilding,
    profile: TbUser,
    fixation: TbBriefcase,
    document: TbFileText,
    system: TbBell,
}

type UserLogAvatarProps = {
    type?: NotificationType | null
}

const resolveTypeCode = (type?: NotificationType | null) => {
    const code = type?.code ?? type?.value ?? ''
    return String(code).toLowerCase()
}

const UserLogAvatar = ({ type }: UserLogAvatarProps) => {
    const Icon = iconByCode[resolveTypeCode(type)] ?? TbBell
    const isSystem = isSystemNotificationType(type)

    return (
        <Avatar
            size={35}
            shape="circle"
            className={classNames(
                isSystem
                    ? 'text-sky-700 bg-sky-100 dark:text-sky-100 dark:bg-sky-500/30'
                    : 'text-gray-900 bg-gray-100 dark:text-white dark:bg-gray-700',
            )}
            icon={<Icon />}
        />
    )
}

export default UserLogAvatar
