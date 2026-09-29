import useDarkMode from '@/utils/hooks/useDarkMode'
import Switcher from '@/components/ui/Switcher'
import { TbSun, TbMoon } from 'react-icons/tb'
import classNames from '@/utils/classNames'

type ThemeModeToggleProps = {
    collapsed?: boolean
    className?: string
}

const ThemeModeToggle = ({ collapsed = false, className }: ThemeModeToggleProps) => {
    const [isDark, setIsDark] = useDarkMode()

    const toggleMode = () => {
        setIsDark(isDark ? 'light' : 'dark')
    }

    if (collapsed) {
        return (
            <div className={classNames('flex justify-center p-3 h-14 items-center', className)}>
                <button
                    type="button"
                    onClick={toggleMode}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                    title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
                >
                    {isDark ? (
                        <TbMoon className="text-xl text-gray-200" />
                    ) : (
                        <TbSun className="text-xl text-gray-700" />
                    )}
                </button>
            </div>
        )
    }

    return (
        <div className="p-2">
            <div
                className={classNames(
                    'flex items-center justify-between h-11 px-3 rounded-xl cursor-pointer select-none bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 overflow-hidden whitespace-nowrap',
                    className,
                )}
                onClick={toggleMode}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0 text-gray-500 dark:text-gray-400">
                        {isDark ? <TbMoon /> : <TbSun />}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                        {isDark ? 'Тёмная тема' : 'Светлая тема'}
                    </span>
                </div>
                <div className="shrink-0 ml-2">
                    <Switcher
                        checked={isDark}
                        checkedContent={<TbMoon className="text-base text-gray-900" />}
                        unCheckedContent={<TbSun className="text-base text-gray-700" />}
                        onChange={(checked) => setIsDark(checked ? 'dark' : 'light')}
                    />
                </div>
            </div>
        </div>
    )
}

export default ThemeModeToggle
