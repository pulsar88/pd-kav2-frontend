import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: [],
    },
    {
        key: 'fixations',
        path: '/fixations',
        component: lazy(() => import('@/views/fixations')),
        authority: [],
    },
    {
        key: 'fixations',
        path: '/fixations/:id',
        component: lazy(() => import('@/views/fixations/FixationDetails')),
        authority: [],
    },
    {
        key: 'objects',
        path: '/objects',
        component: lazy(() => import('@/views/objects')),
        authority: [],
    },
    {
        key: 'objects',
        path: '/objects/:id',
        component: lazy(() => import('@/views/objects/ComplexCheckboard')),
        authority: [],
    },
    {
        key: 'favoritePremises',
        path: '/favorite-premises',
        component: lazy(() => import('@/views/favorite-premises')),
        authority: [],
    },
    {
        key: 'profile',
        path: '/account/profile',
        component: lazy(() => import('@/views/account/Profile')),
        authority: [],
    },
    {
        key: 'notifications',
        path: '/account/notifications',
        component: lazy(() => import('@/views/notifications')),
        authority: [],
    },
    {
        key: 'tools',
        path: '/tools',
        component: lazy(() => import('@/views/tools')),
        authority: [],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'tools',
        path: '/tools/mortgage-calculator',
        component: lazy(() => import('@/views/mortgage-calculator')),
        authority: [],
    },
    {
        key: 'help',
        path: '/help/create',
        component: lazy(() => import('@/views/help-center/CreateArticle')),
        authority: [],
    },
    {
        key: 'help',
        path: '/help/:id/edit',
        component: lazy(() => import('@/views/help-center/EditArticle')),
        authority: [],
    },
    {
        key: 'help',
        path: '/help/:id',
        component: lazy(() => import('@/views/help-center/Article')),
        authority: [],
    },
    {
        key: 'help',
        path: '/help',
        component: lazy(() => import('@/views/help-center')),
        authority: [],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'news',
        path: '/news/create',
        component: lazy(() => import('@/views/help-center/CreateArticle')),
        authority: [],
    },
    {
        key: 'news',
        path: '/news/:id/edit',
        component: lazy(() => import('@/views/help-center/EditArticle')),
        authority: [],
    },
    {
        key: 'news',
        path: '/news/:id',
        component: lazy(() => import('@/views/help-center/Article')),
        authority: [],
    },
    {
        key: 'news',
        path: '/news',
        component: lazy(() => import('@/views/news')),
        authority: [],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'events',
        path: '/events/create',
        component: lazy(() => import('@/views/help-center/CreateArticle')),
        authority: [],
    },
    {
        key: 'events',
        path: '/events/:id/edit',
        component: lazy(() => import('@/views/help-center/EditArticle')),
        authority: [],
    },
    {
        key: 'events',
        path: '/events/:id',
        component: lazy(() => import('@/views/help-center/Article')),
        authority: [],
    },
    {
        key: 'events',
        path: '/events',
        component: lazy(() => import('@/views/events')),
        authority: [],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    ...othersRoute,
]
