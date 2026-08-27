import {
    NAV_ITEM_TYPE_ITEM,
    NAV_ITEM_TYPE_TITLE,
} from '@/constants/navigation.constant'

import {
    AGENCY_SUPERVISOR,
    SUPERVISOR,
    ADMIN,
    AGENT_CABINET_ROLES,
    CONTENT_MANAGER_ALLOWED_ROLES,
} from '@/constants/roles.constant'

import type { NavigationTree } from '@/@types/navigation'

const agentCabinetAuthority = [...AGENT_CABINET_ROLES]
const contentManagerAllowedAuthority = [...CONTENT_MANAGER_ALLOWED_ROLES]

const navigationConfig: NavigationTree[] = [
    {
        key: 'main',
        path: '',
        title: 'Основное',
        translateKey: 'nav.main.main',
        icon: '',
        type: NAV_ITEM_TYPE_TITLE,
        authority: contentManagerAllowedAuthority,
        subMenu: [
            {
                key: 'home',
                path: '/home',
                title: 'Дашборд',
                translateKey: 'nav.home',
                icon: 'home',
                type: NAV_ITEM_TYPE_ITEM,
                authority: agentCabinetAuthority,
                subMenu: [],
            },
            {
                key: 'fixations',
                path: '/fixations',
                title: 'Фиксации',
                translateKey: 'nav.fixations',
                icon: 'fixations',
                type: NAV_ITEM_TYPE_ITEM,
                authority: agentCabinetAuthority,
                subMenu: [],
            },
            {
                key: 'objects',
                path: '/objects',
                title: 'Объекты',
                translateKey: 'nav.objects',
                icon: 'objects',
                type: NAV_ITEM_TYPE_ITEM,
                authority: agentCabinetAuthority,
                subMenu: [],
            },
            {
                key: 'favoritePremises',
                path: '/favorite-premises',
                title: 'Избранное',
                translateKey: 'nav.favoritePremises',
                icon: 'favoritePremises',
                type: NAV_ITEM_TYPE_ITEM,
                authority: agentCabinetAuthority,
                subMenu: [],
            },
            {
                key: 'tools',
                path: '/tools',
                title: 'Инструменты',
                translateKey: 'nav.tools',
                icon: 'tools',
                type: NAV_ITEM_TYPE_ITEM,
                authority: agentCabinetAuthority,
                subMenu: [],
            },
            {
                key: 'profile',
                path: '/account/profile',
                title: 'Профиль',
                translateKey: 'nav.profile',
                icon: 'profile',
                type: NAV_ITEM_TYPE_ITEM,
                authority: contentManagerAllowedAuthority,
                subMenu: [],
            },
            {
                key: 'agencyRequests',
                path: '/agency/requests',
                title: 'Заявки в агентство',
                translateKey: 'nav.agencyRequests',
                icon: 'agencyRequests',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [AGENCY_SUPERVISOR, SUPERVISOR, ADMIN],
                subMenu: [],
            },
        ],
    },
    {
        key: 'content',
        path: '',
        title: 'Информация',
        translateKey: 'nav.content.content',
        icon: '',
        type: NAV_ITEM_TYPE_TITLE,
        authority: contentManagerAllowedAuthority,
        subMenu: [
            {
                key: 'news',
                path: '/news',
                title: 'Новости',
                translateKey: 'nav.content.news',
                icon: 'news',
                type: NAV_ITEM_TYPE_ITEM,
                authority: contentManagerAllowedAuthority,
                subMenu: [],
            },
            {
                key: 'events',
                path: '/news/events',
                title: 'События',
                translateKey: 'nav.content.events',
                icon: 'events',
                type: NAV_ITEM_TYPE_ITEM,
                authority: contentManagerAllowedAuthority,
                subMenu: [],
            },
            {
                key: 'help',
                path: '/help',
                title: 'Помощь',
                translateKey: 'nav.content.help',
                icon: 'help',
                type: NAV_ITEM_TYPE_ITEM,
                authority: contentManagerAllowedAuthority,
                subMenu: [],
            },
        ],
    },
]

export default navigationConfig
