import { useEffect, useState } from 'react'
import Loading from '@/components/shared/Loading'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import TextBlockSkeleton from '@/components/shared/loaders/TextBlockSkeleton'
import Card from '@/components/ui/Card'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ArticleBody from './components/ArticleBody'
import ArticleTableOfContent from './components/ArticleTableOfContent'
import ArticleViewActions from './components/ArticleViewActions'
import {
    apiDeleteSupportHubArticle,
    apiGetSupportHubArticle,
} from '@/services/HelpCenterService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { useNavigate, useParams } from 'react-router'
import { CONTENT_MANAGER } from '@/constants/roles.constant'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import { useSessionUser } from '@/store/authStore'
import useAuthority from '@/utils/hooks/useAuthority'
import classNames from '@/utils/classNames'
import { usePublicationKind } from './publicationKind'
import { parseItemSlug } from './itemSlug'
import type { GetSupportHubArticleResponse } from './types'

const Article = () => {
    const { slug } = useParams()
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const userAuthority = useSessionUser((state) => state.user.authority) ?? []
    const canManageContent = useAuthority(userAuthority, [CONTENT_MANAGER])
    // URL вида "{id}-{code}": id берём из первого сегмента,
    // запрос на детальную запись идёт по нему
    const resolvedId = parseItemSlug(slug ?? '').id
    const [data, setData] = useState<GetSupportHubArticleResponse | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(resolvedId))
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (!resolvedId) {
            setData(null)
            setIsLoading(false)
            return
        }

        let cancelled = false
        setIsLoading(true)

        void apiGetSupportHubArticle<GetSupportHubArticleResponse>({
            id: resolvedId,
        })
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
    }, [resolvedId])

    const handleDelete = async () => {
        if (!data?.id) return

        setIsDeleting(true)
        try {
            await apiDeleteSupportHubArticle({ id: data.id })
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
                <Card className="min-w-0 w-full flex-1">
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

            <ArticleViewActions
                onBack={() => navigate(kind.basePath)}
                canManage={Boolean(slug && canManageContent)}
                isDraft={Boolean(data?.isDraft)}
                onEdit={() =>
                    navigate(`${kind.basePath}/${slug}/edit`)
                }
                onDelete={() => setIsDeleteOpen(true)}
            />

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
