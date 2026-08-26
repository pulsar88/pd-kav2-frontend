import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import type { Routes } from '@/@types/routes'
import {
    AGENCY_SUPERVISOR,
    SUPERVISOR,
    ADMIN,
    CONTENT_MANAGER,
    AGENT_CABINET_ROLES,
    CONTENT_MANAGER_ALLOWED_ROLES,
} from '@/constants/roles.constant'

const agentCabinetAuthority = [...AGENT_CABINET_ROLES]
const contentManagerAllowedAuthority = [...CONTENT_MANAGER_ALLOWED_ROLES]

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: agentCabinetAuthority,
    },
    {
        key: 'fixations',
        path: '/fixations',
        component: lazy(() => import('@/views/fixations')),
        authority: agentCabinetAuthority,
    },
    {
        key: 'fixations',
        path: '/fixations/:id',
        component: lazy(() => import('@/views/fixations/FixationDetails')),
        authority: agentCabinetAuthority,
    },
    {
        key: 'objects',
        path: '/objects',
        component: lazy(() => import('@/views/objects')),
        authority: agentCabinetAuthority,
    },
    {
        key: 'objects',
        path: '/objects/:id',
        component: lazy(() => import('@/views/objects/ComplexCheckboard')),
        authority: agentCabinetAuthority,
    },
    {
        key: 'favoritePremises',
        path: '/favorite-premises',
        component: lazy(() => import('@/views/favorite-premises')),
        authority: agentCabinetAuthority,
    },
    {
        key: 'profile',
        path: '/account/profile',
        component: lazy(() => import('@/views/account/Profile')),
        authority: contentManagerAllowedAuthority,
    },
    {
        key: 'notifications',
        path: '/account/notifications',
        component: lazy(() => import('@/views/notifications')),
        authority: agentCabinetAuthority,
    },
    {
        key: 'tools',
        path: '/tools',
        component: lazy(() => import('@/views/tools')),
        authority: agentCabinetAuthority,
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'tools',
        path: '/tools/mortgage-calculator',
        component: lazy(() => import('@/views/mortgage-calculator')),
        authority: agentCabinetAuthority,
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'help',
        path: '/help/create',
        component: lazy(() => import('@/views/help-center/CreateArticle')),
        authority: [CONTENT_MANAGER],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'help',
        path: '/help/:id/edit',
        component: lazy(() => import('@/views/help-center/EditArticle')),
        authority: [CONTENT_MANAGER],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'help',
        path: '/help/:id',
        component: lazy(() => import('@/views/help-center/Article')),
        authority: contentManagerAllowedAuthority,
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'help',
        path: '/help',
        component: lazy(() => import('@/views/help-center')),
        authority: contentManagerAllowedAuthority,
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'news',
        path: '/news/create',
        component: lazy(() => import('@/views/help-center/CreateArticle')),
        authority: [CONTENT_MANAGER],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'news',
        path: '/news/:id/edit',
        component: lazy(() => import('@/views/help-center/EditArticle')),
        authority: [CONTENT_MANAGER],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'news',
        path: '/news/:id',
        component: lazy(() => import('@/views/help-center/Article')),
        authority: contentManagerAllowedAuthority,
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'news',
        path: '/news',
        component: lazy(() => import('@/views/news')),
        authority: contentManagerAllowedAuthority,
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'events',
        path: '/events/create',
        component: lazy(() => import('@/views/help-center/CreateArticle')),
        authority: [CONTENT_MANAGER],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'events',
        path: '/events/:id/edit',
        component: lazy(() => import('@/views/help-center/EditArticle')),
        authority: [CONTENT_MANAGER],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'events',
        path: '/events/:id',
        component: lazy(() => import('@/views/help-center/Article')),
        authority: contentManagerAllowedAuthority,
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'events',
        path: '/events',
        component: lazy(() => import('@/views/events')),
        authority: contentManagerAllowedAuthority,
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'agencyRequests',
        path: '/agency/requests',
        component: lazy(() => import('@/views/agency/AgencyRequests')),
        authority: [AGENCY_SUPERVISOR, SUPERVISOR, ADMIN],
    },
    ...othersRoute,
]
