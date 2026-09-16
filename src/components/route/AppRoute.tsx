import { useEffect, useCallback, useMemo } from 'react'
import { useRouteKeyStore } from '@/store/routeKeyStore'
import { useLocation } from 'react-router'
import { useThemeStore } from '@/store/themeStore'
import navigationConfig from '@/configs/navigation.config'
import type { NavigationTree } from '@/@types/navigation'
import type { LayoutType } from '@/@types/theme'
import type { ComponentType } from 'react'

export type AppRouteProps<T> = {
    component: ComponentType<T>
    routeKey: string
    layout?: LayoutType
}

const findExactNavKey = (
    items: NavigationTree[],
    pathname: string,
): string | undefined => {
    for (const item of items) {
        if (item.path && item.path === pathname) {
            return item.key
        }
        if (item.subMenu?.length) {
            const nested = findExactNavKey(item.subMenu, pathname)
            if (nested) return nested
        }
    }
    return undefined
}

const AppRoute = <T extends Record<string, unknown>>({
    component: Component,
    routeKey,
    ...props
}: AppRouteProps<T>) => {
    const location = useLocation()

    const { layout, setPreviousLayout, setLayout } = useThemeStore(
        (state) => state,
    )

    const { type: layoutType, previousType: previousLayout } = layout

    const setCurrentRouteKey = useRouteKeyStore(
        (state) => state.setCurrentRouteKey,
    )

    const resolvedRouteKey = useMemo(
        () =>
            findExactNavKey(navigationConfig, location.pathname) ?? routeKey,
        [location.pathname, routeKey],
    )

    const handleLayoutChange = useCallback(() => {
        setCurrentRouteKey(resolvedRouteKey)

        if (props.layout && props.layout !== layoutType) {
            setPreviousLayout(layoutType)
            setLayout(props.layout)
        }

        if (!props.layout && previousLayout && layoutType !== previousLayout) {
            setLayout(previousLayout)
            setPreviousLayout('')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.layout, resolvedRouteKey])

    useEffect(() => {
        handleLayoutChange()
    }, [location, handleLayoutChange])

    return <Component {...(props as T)} />
}

export default AppRoute
