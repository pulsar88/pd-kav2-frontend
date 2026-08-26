import { useEffect, useState } from 'react'
import Loading from '@/components/shared/Loading'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import TextBlockSkeleton from '@/components/shared/loaders/TextBlockSkeleton'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ArticleBody from './components/ArticleBody'
import ArticleTableOfContent from './components/ArticleTableOfContent'
import {
    apiDeleteSupportHubArticle,
    apiGetSupportHubArticle,
} from '@/services/HelpCenterService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { useNavigate, useParams } from 'react-router'
import { TbArrowNarrowLeft, TbEdit, TbTrash } from 'react-icons/tb'
import { CONTENT_MANAGER } from '@/constants/roles.constant'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import { useSessionUser } from '@/store/authStore'
import useAuthority from '@/utils/hooks/useAuthority'
import classNames from '@/utils/classNames'
import { usePublicationKind } from './publicationKind'
import type { GetSupportHubArticleResponse } from './types'

const Article = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const userAuthority = useSessionUser((state) => state.user.authority) ?? []
    const canManageContent = useAuthority(userAuthority, [CONTENT_MANAGER])
    const [data, setData] = useState<GetSupportHubArticleResponse | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(id))
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (!id) {
            setData(null)
            setIsLoading(false)
            return
        }

        let cancelled = false
        setIsLoading(true)

        void apiGetSupportHubArticle<GetSupportHubArticleResponse>({ id })
            .then((article) => {
                if (!cancelled) {
                    setData(article)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setData(null)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [id])

    const handleDelete = async () => {
        if (!id) return

        setIsDeleting(true)
        try {
            await apiDeleteSupportHubArticle({ id })
            toast.push(
                <Notification type="success">{kind.deleteSuccess}</Notification>,
                { placement: 'top-end' },
            )
            setIsDeleteOpen(false)
            navigate(kind.basePath)
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(error, kind.deleteError)}
                </Notification>,
                { placement: 'top-end' },
            )
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div
            className={classNames(
                'min-w-0 w-full py-6',
                PAGE_CONTAINER_GUTTER_X,
            )}
        >
            <div className="min-w-0 gap-4 lg:flex">
                <Card
                    className="min-w-0 w-full flex-1"
                    header={{
                        bordered: true,
                        className: 'card-header-extra',
                        content: (
                            <button
                                type="button"
                                className="inline-flex shrink-0 items-center gap-3 text-gray-800 outline-hidden transition-colors hover:text-primary dark:text-gray-100 dark:hover:text-primary"
                                onClick={() => navigate(kind.basePath)}
                            >
                                <span className="rounded-full bg-gray-100 p-2 text-xl transition-colors hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/20">
                                    <TbArrowNarrowLeft />
                                </span>
                                <span className="text-sm font-semibold">
                                    Назад
                                </span>
                            </button>
                        ),
                        extra:
                            id && canManageContent ? (
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <Button
                                        variant="solid"
                                        icon={<TbEdit />}
                                        onClick={() =>
                                            navigate(
                                                `${kind.basePath}/${id}/edit`,
                                            )
                                        }
                                    >
                                        Редактировать
                                    </Button>
                                    <Button
                                        variant="plain"
                                        icon={<TbTrash />}
                                        className="border border-error text-error hover:bg-error/10 hover:text-error"
                                        onClick={() => setIsDeleteOpen(true)}
                                    >
                                        Удалить
                                    </Button>
                                </div>
                            ) : null,
                    }}
                >
                    <Loading
                        loading={isLoading}
                        customLoader={
                            <div className="flex flex-col gap-8">
                                <MediaSkeleton />
                                <TextBlockSkeleton rowCount={6} />
                                <TextBlockSkeleton rowCount={4} />
                            </div>
                        }
                    >
                        {data ? <ArticleBody data={data} /> : null}
                    </Loading>
                </Card>
                {data?.tableOfContent?.length ? (
                    <ArticleTableOfContent content={data.tableOfContent} />
                ) : null}
            </div>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                type="danger"
                title={kind.deleteConfirmTitle}
                confirmText="Удалить"
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: isDeleting,
                    customColorClass: () =>
                        'bg-error hover:bg-error/90 active:bg-error border-error',
                }}
                onCancel={() => setIsDeleteOpen(false)}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={() => {
                    void handleDelete()
                }}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {kind.deleteConfirmText}
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default Article
