import { NEWS_TYPE } from './helpCenterApi.types'
import endpointConfig from '@/configs/endpoint.config'
import type { ComponentType } from 'react'
import { TbArticle, TbCalendarEvent, TbNews } from 'react-icons/tb'
import { useLocation } from 'react-router'

export type PublicationKind = 'article' | 'news' | 'event'

export type PublicationKindConfig = {
    kind: PublicationKind
    type: number
    basePath: string
    listEndpoint: string
    title: string
    description: string
    searchPlaceholder: string
    listHeading: string
    itemName: string
    itemNameGenitive: string
    itemNameGenitivePlural: string
    createLabel: string
    createSuccess: string
    updateSuccess: string
    notFoundTitle: string
    emptyTitle: string
    emptyHint: string
    showAllLabel: string
    titleRequired: string
    previewRequired: string
    createError: string
    updateError: string
    deleteSuccess: string
    deleteError: string
    deleteConfirmTitle: string
    deleteConfirmText: string
    loadError: string
    icon: ComponentType<{ className?: string }>
}

export const PUBLICATION_KIND: Record<PublicationKind, PublicationKindConfig> =
    {
        article: {
            kind: 'article',
            type: NEWS_TYPE.ARTICLE,
            basePath: '/help',
            listEndpoint: endpointConfig.newsArticles,
            title: 'Центр помощи',
            description:
                'Ищите ответы и открывайте статьи по работе с кабинетом агента.',
            searchPlaceholder: 'Поиск по статьям',
            listHeading: 'Статьи',
            itemName: 'статья',
            itemNameGenitive: 'статьи',
            itemNameGenitivePlural: 'статей',
            createLabel: 'Создать статью',
            createSuccess: 'Статья создана',
            updateSuccess: 'Статья сохранена',
            notFoundTitle: 'Статьи не найдены',
            emptyTitle: 'Статей пока нет',
            emptyHint: 'Создайте первую статью для центра помощи',
            showAllLabel: 'Показать все статьи',
            titleRequired: 'Укажите заголовок статьи',
            previewRequired: 'Укажите превью текст статьи',
            createError: 'Не удалось создать статью',
            updateError: 'Не удалось сохранить статью',
            deleteSuccess: 'Статья удалена',
            deleteError: 'Не удалось удалить статью',
            deleteConfirmTitle: 'Удалить статью?',
            deleteConfirmText:
                'Статья будет удалена без возможности восстановления.',
            loadError: 'Статья не найдена',
            icon: TbArticle,
        },
        news: {
            kind: 'news',
            type: NEWS_TYPE.NEWS,
            basePath: '/news',
            listEndpoint: endpointConfig.news,
            title: 'Новости',
            description: 'Актуальные новости компании и рынка недвижимости.',
            searchPlaceholder: 'Поиск по новостям',
            listHeading: 'Новости',
            itemName: 'новость',
            itemNameGenitive: 'новости',
            itemNameGenitivePlural: 'новостей',
            createLabel: 'Создать новость',
            createSuccess: 'Новость создана',
            updateSuccess: 'Новость сохранена',
            notFoundTitle: 'Новости не найдены',
            emptyTitle: 'Новостей пока нет',
            emptyHint: 'Создайте первую новость',
            showAllLabel: 'Показать все новости',
            titleRequired: 'Укажите заголовок новости',
            previewRequired: 'Укажите превью текст новости',
            createError: 'Не удалось создать новость',
            updateError: 'Не удалось сохранить новость',
            deleteSuccess: 'Новость удалена',
            deleteError: 'Не удалось удалить новость',
            deleteConfirmTitle: 'Удалить новость?',
            deleteConfirmText:
                'Новость будет удалена без возможности восстановления.',
            loadError: 'Новость не найдена',
            icon: TbNews,
        },
        event: {
            kind: 'event',
            type: NEWS_TYPE.EVENT,
            basePath: '/events',
            listEndpoint: endpointConfig.newsEvents,
            title: 'События',
            description: 'Мероприятия, встречи и важные даты.',
            searchPlaceholder: 'Поиск по событиям',
            listHeading: 'События',
            itemName: 'событие',
            itemNameGenitive: 'события',
            itemNameGenitivePlural: 'событий',
            createLabel: 'Создать событие',
            createSuccess: 'Событие создано',
            updateSuccess: 'Событие сохранено',
            notFoundTitle: 'События не найдены',
            emptyTitle: 'Событий пока нет',
            emptyHint: 'Создайте первое событие',
            showAllLabel: 'Показать все события',
            titleRequired: 'Укажите заголовок события',
            previewRequired: 'Укажите превью текст события',
            createError: 'Не удалось создать событие',
            updateError: 'Не удалось сохранить событие',
            deleteSuccess: 'Событие удалено',
            deleteError: 'Не удалось удалить событие',
            deleteConfirmTitle: 'Удалить событие?',
            deleteConfirmText:
                'Событие будет удалено без возможности восстановления.',
            loadError: 'Событие не найдено',
            icon: TbCalendarEvent,
        },
    }

export const resolvePublicationKind = (pathname: string): PublicationKind => {
    if (pathname === '/events' || pathname.startsWith('/events/')) {
        return 'event'
    }

    if (pathname === '/news' || pathname.startsWith('/news/')) {
        return 'news'
    }

    return 'article'
}

export const usePublicationKind = () => {
    const { pathname } = useLocation()
    return PUBLICATION_KIND[resolvePublicationKind(pathname)]
}
