import classNames from '@/utils/classNames'
import Tooltip from '@/components/ui/Tooltip'
import type { ComponentProps } from 'react'

export type ToolButtonProps = ComponentProps<'button'> & {
    active?: boolean
    title?: string
}

const ToolButton = (props: ToolButtonProps) => {
    const { className, disabled, active, title, children, ...rest } = props

    const button = (
        <button
            className={classNames(
                'tool-button text-xl heading-text hover:text-primary flex items-center p-1.5 rounded-lg transition-colors',
                active &&
                    'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
                disabled && 'opacity-20 cursor-not-allowed',
                className,
            )}
            type="button"
            disabled={disabled}
            aria-pressed={active ? true : undefined}
            {...rest}
        >
            {children}
        </button>
    )

    if (!title || disabled) {
        return button
    }

    return (
        <Tooltip title={title} placement="top">
            {button}
        </Tooltip>
    )
}

export default ToolButton
