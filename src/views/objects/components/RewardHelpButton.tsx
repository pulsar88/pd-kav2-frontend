import { Link, useNavigate } from 'react-router'
import { TbHelpCircle } from 'react-icons/tb'
import Tooltip from '@/components/ui/Tooltip'

const HELP_PATH = '/help/58-rabota-s-kommercheskimi-pomescheniyami'

const canHoverTooltip = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches

type RewardHelpButtonProps = {
    wrapperClass?: string
    className?: string
}

const RewardHelpButton = ({
    wrapperClass,
    className,
}: RewardHelpButtonProps) => {
    const navigate = useNavigate()

    return (
        <Tooltip
            wrapperClass={wrapperClass}
            title={
                <span className="block">
                    Подробнее о вознаграждении в разделе помощи.{' '}
                    <Link
                        to={HELP_PATH}
                        className="font-semibold underline"
                        onClick={(event) => event.stopPropagation()}
                    >
                        Открыть
                    </Link>
                </span>
            }
        >
            <button
                type="button"
                className={
                    className ??
                    'inline-flex items-center justify-center rounded-full bg-white/90 p-1.5 text-gray-600 shadow-sm transition hover:bg-white hover:text-gray-900 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-700'
                }
                aria-label="Подробнее о вознаграждении"
                onClick={() => {
                    if (!canHoverTooltip()) {
                        return
                    }
                    navigate(HELP_PATH)
                }}
            >
                <TbHelpCircle className="text-lg" />
            </button>
        </Tooltip>
    )
}

export default RewardHelpButton
