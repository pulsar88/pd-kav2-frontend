import { useEffect, useState } from 'react'
import ArticleCard from './ArticleCard'
import {
    apiDeleteSupportHubArticle,
    apiGetSupportHubArticles,
} from '@/services/HelpCenterService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import NoDataFound from '@/assets/svg/NoDataFound'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import Pagination from '@/components/ui/Pagination'
import Spinner from '@/components/ui/Spinner'
import Select from '@/components/ui/Select'
import toast from '@/components/ui/toast'
import { TbArrowNarrowLeft, TbPlus } from 'react-icons/tb'
import { useNavigate } from 'react-router'
import { CONTENT_MANAGER } from '@/constants/roles.constant'
import { useSessionUser } from '@/store/authStore'
import useAuthority from '@/utils/hooks/useAuthority'
import { DEFAULT_HELP_CENTER_PAGE_SIZE } from '../helpCenterApiQuery'
import { usePublicationKind } from '../publicationKind'
import type { GetSupportHubArticlesResponse } from '../types'

type Option = {
    value: number
    label: string
}

const pageSizeOptions: Option[] = [20, 50, 100].map((value) => ({
    value,
    label: `${value} / стр.`,
}))

type ArticleListProps = {
    query?: string
}

const ArticleList = ({ query = '' }: ArticleListProps) => {
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const userAuthority = useSessionUser((state) => state.user.authority) ?? []
    const canManageContent = useAuthority(userAuthority, [CONTENT_MANAGER])
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_HELP_CENTER_PAGE_SIZE)
    const [data, setData] = useState<GetSupportHubArticlesResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [reloadToken, setReloadToken] = useState(0)

    useEffect(() => {
        setPageIndex(1)
    }, [query, pageSize, kind.kind])

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)

        void apiGetSupportHubArticles(
            {
                query,
                page: pageIndex,
                page_size: pageSize,
            },
            kind.listEndpoint,
        )
            .then((response) => {
                if (!cancelled) {
                    setData(response)
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
    }, [query, pageIndex, pageSize, kind.listEndpoint, reloadToken])

    const articles = data?.list ?? []
    const totalCount = data?.total ?? 0
    const deleteTarget = articles.find((article) => article.id === deleteId)

    const handleDelete = async () => {
        if (!deleteId) return

        setIsDeleting(true)
        try {
            await apiDeleteSupportHubArticle({ id: deleteId })
            toast.push(
                <Notification type="success">{kind.deleteSuccess}</Notification>,
                { placement: 'top-end' },
            )
            setDeleteId(null)

            const remainingOnPage = articles.length - 1
            if (remainingOnPage <= 0 && pageIndex > 1) {
                setPageIndex((page) => page - 1)
            } else {
                setReloadToken((token) => token + 1)
            }
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
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                {query ? (
                    <h3 className="flex min-w-0 flex-1 items-center gap-4">
                        <button
                            type="button"
                            className="shrink-0 rounded-full bg-gray-100 p-2 text-xl text-gray-800 outline-hidden transition-colors hover:bg-primary/10 hover:text-primary dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-primary/20 dark:hover:text-primary"
                            onClick={() => navigate(kind.basePath)}
                        >
                            <TbArrowNarrowLeft />
                        </button>
                        <span className="min-w-0 truncate">
                            <span className="font-normal">
                                Результаты по запросу:{' '}
                            </span>
                            <span className="font-semibold">{query}</span>
                        </span>
                    </h3>
                ) : (
                    <h3 className="mb-0">{kind.listHeading}</h3>
                )}
                {canManageContent ? (
                    <Button
                        variant="solid"
                        size="sm"
                        className="shrink-0"
                        icon={<TbPlus />}
                        onClick={() => navigate(`${kind.basePath}/create`)}
                    >
                        {kind.createLabel}
                    </Button>
                ) : null}
            </div>

            {isLoading ? (
                <div className="flex min-h-48 items-center justify-center">
                    <Spinner size={36} />
                </div>
            ) : null}

            {!isLoading && articles.length === 0 ? (
                <div className="mt-12 text-center">
                    {query ? (
                        <>
                            <div className="flex justify-center">
                                <NoDataFound height={200} width={200} />
                            </div>
                            <h3 className="mt-6">{kind.notFoundTitle}</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Попробуйте изменить запрос или вернитесь к списку
                            </p>
                            <button
                                type="button"
                                className="mt-4 text-primary hover:underline"
                                onClick={() => navigate(kind.basePath)}
                            >
                                {kind.showAllLabel}
                            </button>
                        </>
                    ) : canManageContent ? (
                        <>
                            <div className="flex justify-center">
                                <NoDataFound height={200} width={200} />
                            </div>
                            <h3 className="mt-6">{kind.emptyTitle}</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {kind.emptyHint}
                            </p>
                            <Button
                                className="mt-4"
                                variant="solid"
                                icon={<TbPlus />}
                                onClick={() => navigate(`${kind.basePath}/create`)}
                            >
                                {kind.createLabel}
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 text-4xl text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                                <kind.icon />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                {kind.emptyTitle}
                            </h4>
                        </div>
                    )}
                </div>
            ) : null}

            {!isLoading && articles.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {articles.map((article) => (
                            <ArticleCard
                                key={article.code ?? article.id}
                                id={article.id}
                                code={article.code}
                                title={article.title}
                                previewText={article.previewText}
                                timeToRead={article.timeToRead}
                                isDraft={article.isDraft}
                                canManage={canManageContent}
                                onDelete={setDeleteId}
                            />
                        ))}
                    </div>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="overflow-x-auto">
                            <Pagination
                                currentPage={pageIndex}
                                pageSize={pageSize}
                                total={totalCount}
                                pagerCount={5}
                                onChange={setPageIndex}
                            />
                        </div>
                        <div
                            className="shrink-0 self-end sm:self-auto"
                            style={{ minWidth: 130 }}
                        >
                            <Select
                                instanceId={`${kind.kind}-page-size`}
                                size="sm"
                                menuPlacement="top"
                                isSearchable={false}
                                value={pageSizeOptions.filter(
                                    (option) => option.value === pageSize,
                                )}
                                options={pageSizeOptions}
                                onChange={(option) => {
                                    const size = (option as Option | null)
                                        ?.value
                                    if (typeof size === 'number') {
                                        setPageSize(size)
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
            ) : null}

            <ConfirmDialog
                isOpen={Boolean(deleteId)}
                type="danger"
                title={kind.deleteConfirmTitle}
                confirmText="Удалить"
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: isDeleting,
                    customColorClass: () =>
                        'bg-error hover:bg-error/90 active:bg-error border-error',
                }}
                onCancel={() => setDeleteId(null)}
                onClose={() => setDeleteId(null)}
                onConfirm={() => {
                    void handleDelete()
                }}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {deleteTarget?.title ? (
                        <>
                            «{deleteTarget.title}». {kind.deleteConfirmText}
                        </>
                    ) : (
                        kind.deleteConfirmText
                    )}
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default ArticleList
