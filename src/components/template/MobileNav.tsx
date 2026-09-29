import { useState, Suspense, lazy } from 'react'
import classNames from 'classnames'
import Drawer from '@/components/ui/Drawer'
import NavToggle from '@/components/shared/NavToggle'
import ThemeModeToggle from '@/components/template/ThemeModeToggle'
import { DIR_RTL } from '@/constants/theme.constant'
import withHeaderItem, { WithHeaderItemProps } from '@/utils/hoc/withHeaderItem'
import navigationConfig from '@/configs/navigation.config'
import { useThemeStore } from '@/store/themeStore'
import { useRouteKeyStore } from '@/store/routeKeyStore'
import { useSessionUser } from '@/store/authStore'

const VerticalMenuContent = lazy(
    () => import('@/components/template/VerticalMenuContent'),
)

type MobileNavToggleProps = {
    toggled?: boolean
}

const MobileNavToggle = withHeaderItem<
    MobileNavToggleProps & WithHeaderItemProps
>(NavToggle)

const MobileNav = () => {
    const [isOpen, setIsOpen] = useState(false)

    const handleOpenDrawer = () => {
        setIsOpen(true)
    }

    const handleDrawerClose = () => {
        setIsOpen(false)
    }

    const direction = useThemeStore((state) => state.direction)
    const currentRouteKey = useRouteKeyStore((state) => state.currentRouteKey)

    const user = useSessionUser((state) => state.user)
    const userAuthority = user.authority ?? []
    const isAgent = userAuthority.includes('agent') && !userAuthority.includes('supervisor') && !userAuthority.includes('admin')
    const hasAgency = Boolean(user.agency || user.agencyName)

    // Если у агента нет агентства — мобильное меню полностью скрыто
    if (isAgent && !hasAgency) {
        return null
    }

    return (
        <>
            <div className="text-2xl" onClick={handleOpenDrawer}>
                <MobileNavToggle toggled={isOpen} />
            </div>
            <Drawer
                title="Меню"
                isOpen={isOpen}
                bodyClass={classNames('p-0 flex flex-col justify-between h-full')}
                width={330}
                placement={direction === DIR_RTL ? 'right' : 'left'}
                onClose={handleDrawerClose}
                onRequestClose={handleDrawerClose}
            >
                <div className="flex-1 overflow-y-auto">
                    <Suspense fallback={<></>}>
                        {isOpen && (
                            <VerticalMenuContent
                                collapsed={false}
                                navigationTree={navigationConfig}
                                routeKey={currentRouteKey}
                                userAuthority={userAuthority as string[]}
                                direction={direction}
                                onMenuItemClick={handleDrawerClose}
                            />
                        )}
                    </Suspense>
                </div>
                <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-2">
                    <ThemeModeToggle collapsed={false} />
                </div>
            </Drawer>
        </>
    )
}

export default MobileNav
