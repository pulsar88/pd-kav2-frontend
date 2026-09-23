import { useCallback } from 'react'
import useDarkMode from '@/utils/hooks/useDarkMode'
import Switcher from '@/components/ui/Switcher'
import { TbMoon, TbSun } from 'react-icons/tb'

const ModeSwitcher = () => {
    const [isDark, setIsDark] = useDarkMode()

    const onSwitchChange = useCallback(
        (checked: boolean) => {
            setIsDark(checked ? 'dark' : 'light')
        },
        [setIsDark],
    )

    return (
        <div>
            <Switcher
                defaultChecked={isDark}
                checkedContent={<TbMoon className="text-base text-gray-900" />}
                unCheckedContent={<TbSun className="text-base text-gray-700" />}
                onChange={(checked) => onSwitchChange(checked)}
            />
        </div>
    )
}

export default ModeSwitcher
