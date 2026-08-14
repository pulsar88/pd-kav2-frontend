import {
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'

import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'home',
        path: '/home',
        title: 'Home',
        translateKey: 'nav.home',
        icon: 'home',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'fixations',
        path: '/fixations',
        title: 'Фиксации',
        translateKey: 'nav.fixations',
        icon: 'fixations',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'objects',
        path: '/objects',
        title: 'Объекты',
        translateKey: 'nav.objects',
        icon: 'objects',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'favoritePremises',
        path: '/favorite-premises',
        title: 'Избранное',
        translateKey: 'nav.favoritePremises',
        icon: 'favoritePremises',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'tools',
        path: '/tools',
        title: 'Инструменты',
        translateKey: 'nav.tools',
        icon: 'tools',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'profile',
        path: '/account/profile',
        title: 'Профиль',
        translateKey: 'nav.profile',
        icon: 'profile',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },

    {
        key: 'help',
        path: '/help',
        title: 'Помощь',
        translateKey: 'nav.help',
        icon: 'help',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
]

export default navigationConfig
