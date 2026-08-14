import { useEffect, useState } from 'react'
import classNames from '@/utils/classNames'
import Badge from '@/components/ui/Badge'
import { PiBellDuotone } from 'react-icons/pi'

const NotificationToggle = ({
    className,
    dot,
    pulseKey = 0,
}: {
    className?: string
    dot: boolean
    pulseKey?: number
}) => {
    const [isPulsing, setIsPulsing] = useState(false)

    useEffect(() => {
        if (pulseKey <= 0) {
            return undefined
        }

        setIsPulsing(false)

        const frameId = window.requestAnimationFrame(() => {
            setIsPulsing(true)
        })

        const timeoutId = window.setTimeout(() => {
            setIsPulsing(false)
        }, 750)

        return () => {
            window.cancelAnimationFrame(frameId)
            window.clearTimeout(timeoutId)
        }
    }, [pulseKey])

    const showPulse = dot && isPulsing

    return (
        <div className={classNames('text-2xl leading-none', className)}>
            <Badge
                className="inline-flex items-center justify-center"
                badgeStyle={{ top: '3px', right: '6px' }}
                innerClass={classNames(
                    'border-0',
                    !dot && 'hidden',
                    showPulse && 'animate-notification-badge-pop',
                )}
            >
                {showPulse ? (
                    <span
                        key={`notification-ring-${pulseKey}`}
                        className="pointer-events-none absolute top-[3px] right-[6px] z-0 h-3 w-3 -translate-y-2/4 rounded-full bg-error animate-notification-badge-ring ltr:translate-x-2/4 rtl:-translate-x-2/4"
                        aria-hidden
                    />
                ) : null}
                <PiBellDuotone />
            </Badge>
        </div>
    )
}

export default NotificationToggle
