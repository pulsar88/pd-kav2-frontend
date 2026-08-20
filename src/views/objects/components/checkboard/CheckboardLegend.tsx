import classNames from '@/utils/classNames'

type StatusItem = {
    code: string
    name: string
    color: string
    text_color: string
}

type CheckboardLegendProps = {
    statuses: StatusItem[]
    activeStatusCode?: string
    onStatusClick?: (code: string) => void
}

const CheckboardLegend = ({
    statuses,
    activeStatusCode,
    onStatusClick,
}: CheckboardLegendProps) => {
    if (statuses.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Статусы:
            </span>
            {statuses.map((status) => {
                const active = activeStatusCode === status.code
                const className = classNames(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    onStatusClick && 'transition-shadow',
                    onStatusClick &&
                        active &&
                        'ring-2 ring-primary ring-offset-1',
                )
                const style = {
                    backgroundColor: status.color,
                    color: status.text_color,
                }

                if (!onStatusClick) {
                    return (
                        <span
                            key={status.code}
                            className={className}
                            style={style}
                        >
                            {status.name}
                        </span>
                    )
                }

                return (
                    <button
                        key={status.code}
                        type="button"
                        className={className}
                        style={style}
                        onClick={() => onStatusClick(status.code)}
                    >
                        {status.name}
                    </button>
                )
            })}
        </div>
    )
}

export default CheckboardLegend
