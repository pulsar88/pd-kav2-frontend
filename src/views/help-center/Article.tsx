import Loading from '@/components/shared/Loading'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import TextBlockSkeleton from '@/components/shared/loaders/TextBlockSkeleton'
import Button from '@/components/ui/Button'
import ArticleBody from './components/ArticleBody'
import ArticleTableOfContent from './components/ArticleTableOfContent'
import { apiGetSupportHubArticle } from '@/services/HelpCenterService'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { TbArrowNarrowLeft, TbEdit } from 'react-icons/tb'
import { publicationItemKey } from './helpCenterQuery'
import { usePublicationKind } from './publicationKind'
import type { GetSupportHubArticleResponse } from './types'

const Article = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const kind = usePublicationKind()

    const { data, isLoading } = useSWR(
        id ? publicationItemKey(id) : null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, params]) =>
            apiGetSupportHubArticle<GetSupportHubArticleResponse>(params),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
        },
    )

    return (
        <div className="min-w-0 w-full max-w-[1200px]">
            <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2 pt-6">
                <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-3 text-gray-800 outline-hidden transition-colors hover:text-primary dark:text-gray-100 dark:hover:text-primary"
                    onClick={() => navigate(kind.basePath)}
                >
                    <span className="rounded-full bg-gray-100 p-2 text-xl transition-colors hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/20">
                        <TbArrowNarrowLeft />
                    </span>
                    <span className="text-sm font-semibold">Назад</span>
                </button>
                {id ? (
                    <Button
                        variant="solid"
                        icon={<TbEdit />}
                        className="shrink-0"
                        onClick={() => navigate(`${kind.basePath}/${id}/edit`)}
                    >
                        Редактировать
                    </Button>
                ) : null}
            </div>
            <div className="min-w-0 gap-4 lg:flex">
                <div className="mx-auto my-6 w-full max-w-[800px]">
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
                </div>
                {data?.tableOfContent?.length ? (
                    <ArticleTableOfContent content={data.tableOfContent} />
                ) : null}
            </div>
        </div>
    )
}

export default Article
