import classNames from '@/utils/classNames'

type StatusItem = {
    code: string
    name: string
    color: string
    text_color: string
    accent_color: string
}

type CheckboardLegendProps = {
    statuses: StatusItem[]
    activeStatusCode?: string
    onStatusClick: (code: string) => void
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
                return (
                    <button
                        key={status.code}
                        type="button"
                        className={classNames(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-shadow',
                            active && 'ring-2 ring-primary ring-offset-1',
                        )}
                        style={{
                            backgroundColor: status.color,
                            color: status.text_color,
                            borderColor: status.accent_color,
                        }}
                        onClick={() => onStatusClick(status.code)}
                    >
                        <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: status.accent_color }}
                        />
                        {status.name}
                    </button>
                )
            })}
        </div>
    )
}

export default CheckboardLegend
