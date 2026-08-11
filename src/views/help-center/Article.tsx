import Loading from '@/components/shared/Loading'
import Container from '@/components/shared/Container'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import TextBlockSkeleton from '@/components/shared/loaders/TextBlockSkeleton'
import Button from '@/components/ui/Button'
import ArticleBody from './components/ArticleBody'
import ArticleTableOfContent from './components/ArticleTableOfContent'
import { apiGetSupportHubArticle } from '@/services/HelpCenterService'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { TbArrowNarrowLeft, TbEdit } from 'react-icons/tb'
import type { GetSupportHubArticleResponse } from './types'

const Article = () => {
    const { topic, id } = useParams()
    const navigate = useNavigate()

    const { data, isLoading } = useSWR(
        id ? [`/helps/articles/${id}`, { id }] : null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, params]) =>
            apiGetSupportHubArticle<GetSupportHubArticleResponse>(params),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
        },
    )

    const sectionPath = topic ? `/help/${topic}` : '/help'

    return (
        <Container>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 pt-6 pr-4 pl-0">
                <button
                    type="button"
                    className="inline-flex items-center gap-3 text-gray-800 outline-hidden transition-colors hover:text-primary dark:text-gray-100 dark:hover:text-primary"
                    onClick={() => navigate(sectionPath)}
                >
                    <span className="rounded-full bg-gray-100 p-2 text-xl transition-colors hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/20">
                        <TbArrowNarrowLeft />
                    </span>
                    <span className="text-sm font-semibold">Назад</span>
                </button>
                {topic && id ? (
                    <Button
                        variant="solid"
                        icon={<TbEdit />}
                        className="shrink-0"
                        onClick={() =>
                            navigate(`/help/${topic}/${id}/edit`)
                        }
                    >
                        Редактировать
                    </Button>
                ) : null}
            </div>
            <div className="gap-4 lg:flex">
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
                {data?.tableOfContent ? (
                    <ArticleTableOfContent content={data.tableOfContent} />
                ) : null}
            </div>
        </Container>
    )
}

export default Article
