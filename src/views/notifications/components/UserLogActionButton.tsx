import { useNavigate } from 'react-router'
import Button from '@/components/ui/Button'
import { resolveLogActionHref } from '../utils'
import type { NotificationAction } from '@/@types/notification'
import type { MouseEvent } from 'react'

type UserLogActionButtonProps = {
    action: NotificationAction
    onRead?: () => void
}

const UserLogActionButton = ({ action, onRead }: UserLogActionButtonProps) => {
    const navigate = useNavigate()
    const resolved = resolveLogActionHref(action.url)

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        onRead?.()

        if (resolved.external) {
            window.open(resolved.href, '_blank', 'noopener,noreferrer')
            return
        }

        navigate(resolved.href)
    }

    return (
        <Button size="xs" variant="solid" onClick={handleClick}>
            {action.text}
        </Button>
    )
}

export default UserLogActionButton
