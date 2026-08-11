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
        key: 'profile',
        path: '/account/profile',
        component: lazy(() => import('@/views/account/Profile')),
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
        path: '/help',
        component: lazy(() => import('@/views/help-center')),
        authority: [],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    {
        key: 'help',
        path: '/help/:topic/:id/edit',
        component: lazy(() => import('@/views/help-center/EditArticle')),
        authority: [],
    },
    {
        key: 'help',
        path: '/help/:topic/:id',
        component: lazy(() => import('@/views/help-center/Article')),
        authority: [],
    },
    {
        key: 'help',
        path: '/help/:topic',
        component: lazy(() => import('@/views/help-center/TopicArticles')),
        authority: [],
        meta: {
            pageContainerType: 'gutterless',
            pageBackgroundType: 'plain',
        },
    },
    ...othersRoute,
]
