import { useState } from 'react'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { subscribeToWebPush } from '@/utils/webPush'

type PushSubscriptionPromptProps = {
    isOpen: boolean
    onClose: () => void
}

const PushSubscriptionPrompt = ({
    isOpen,
    onClose,
}: PushSubscriptionPromptProps) => {
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const result = await subscribeToWebPush()

            if (result.status === 'subscribed') {
                toast.push(
                    <Notification type="success">
                        Подписка на уведомления включена
                    </Notification>,
                    { placement: 'top-end' },
                )
            } else if (result.status === 'denied') {
                toast.push(
                    <Notification type="warning">
                        Разрешение на уведомления отклонено в браузере
                    </Notification>,
                    { placement: 'top-end' },
                )
            } else if (result.status === 'unsupported') {
                toast.push(
                    <Notification type="warning">
                        Этот браузер не поддерживает Web Push
                    </Notification>,
                    { placement: 'top-end' },
                )
            } else if (result.status === 'missing_vapid') {
                toast.push(
                    <Notification type="danger">
                        Не задан VITE_VAPID_PUBLIC_KEY
                    </Notification>,
                    { placement: 'top-end' },
                )
            } else {
                toast.push(
                    <Notification type="danger">
                        {result.message}
                    </Notification>,
                    { placement: 'top-end' },
                )
            }
        } finally {
            setLoading(false)
            onClose()
        }
    }

    return (
        <ConfirmDialog
            isOpen={isOpen}
            type="info"
            title="Включить уведомления?"
            confirmText="Включить"
            cancelText="Позже"
            confirmButtonProps={{
                loading,
                disabled: loading,
            }}
            cancelButtonProps={{
                disabled: loading,
            }}
            onConfirm={() => {
                void handleConfirm()
            }}
            onCancel={onClose}
            onClose={onClose}
            onRequestClose={onClose}
        >
            <p>
                Разрешите push-уведомления, чтобы получать важные события по
                фиксациям и объектам даже когда вкладка закрыта.
            </p>
        </ConfirmDialog>
    )
}

export default PushSubscriptionPrompt
