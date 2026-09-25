import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import useResponsive from '@/utils/hooks/useResponsive'
import NavToggle from '@/components/shared/NavToggle'
import type { CommonProps } from '@/@types/common'

const _SideNavToggle = ({ className }: CommonProps) => {
    const { layout, setSideNavCollapse } = useThemeStore((state) => state)
    const user = useSessionUser((state) => state.user)
    const userAuthority = user.authority ?? []
    const isAgent = userAuthority.includes('agent') && !userAuthority.includes('supervisor') && !userAuthority.includes('admin')
    const hasAgency = Boolean(user.agency || user.agencyName)

    // Если у агента нет агентства — кнопка сворачивания/разворачивания скрыта
    if (isAgent && !hasAgency) {
        return null
    }

    const sideNavCollapse = layout.sideNavCollapse
    const { larger } = useResponsive()

    const onCollapse = () => {
        setSideNavCollapse(!sideNavCollapse)
    }

    return (
        <>
            {larger.md && (
                <div className={className} role="button" onClick={onCollapse}>
                    <NavToggle className="text-2xl" toggled={!sideNavCollapse} />
                </div>
            )}
        </>
    )
}

const SideNavToggle = withHeaderItem(_SideNavToggle)

export default SideNavToggle
