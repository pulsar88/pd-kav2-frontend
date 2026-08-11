import { useEffect } from 'react'
import ArticleItem from './ArticleItem'
import { categoryLabel } from '../utils'
import { apiGetSupportHubArticles } from '@/services/HelpCenterService'
import isLastChild from '@/utils/isLastChild'
import NoDataFound from '@/assets/svg/NoDataFound'
import useSWRMutation from 'swr/mutation'
import { TbArrowNarrowLeft } from 'react-icons/tb'
import { useNavigate } from 'react-router'
import type { GetSupportHubArticlesResponse } from '../types'

type ArticleListProps = {
    query: string
    topic: string
}

const ArticleList = ({ query, topic }: ArticleListProps) => {
    const navigate = useNavigate()
    const { trigger, data } = useSWRMutation(
        [`/helps/articles`, { query, topic }],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, params]) =>
            apiGetSupportHubArticles<
                GetSupportHubArticlesResponse,
                { query: string; topic: string }
            >(params),
    )

    useEffect(() => {
        if (topic || query) {
            void trigger()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topic, query])

    return (
        <div>
            {query && data && data.length > 0 && (
                <div className="mb-6">
                    <h3 className="flex items-center gap-4">
                        <button
                            type="button"
                            className="rounded-full bg-gray-100 p-2 text-xl text-gray-800 outline-hidden transition-colors hover:bg-primary/10 hover:text-primary dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-primary/20 dark:hover:text-primary"
                            onClick={() => navigate('/help')}
                        >
                            <TbArrowNarrowLeft />
                        </button>
                        <span>
                            <span className="font-normal">
                                Результаты по запросу:{' '}
                            </span>
                            <span className="font-semibold">{query}</span>
                        </span>
                    </h3>
                </div>
            )}
            {query && data && data.length === 0 && (
                <div className="mt-20 text-center">
                    <div className="flex justify-center">
                        <NoDataFound height={280} width={280} />
                    </div>
                    <h3 className="mt-8">Статьи не найдены</h3>
                    <button
                        type="button"
                        className="mt-4 text-primary hover:underline"
                        onClick={() => navigate('/help')}
                    >
                        Вернуться к разделам
                    </button>
                </div>
            )}
            {topic && !query && (
                <div className="mb-6">
                    <h4 className="flex items-center gap-4">
                        <button
                            type="button"
                            className="rounded-full bg-gray-100 p-2 text-xl text-gray-800 outline-hidden transition-colors hover:bg-primary/10 hover:text-primary dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-primary/20 dark:hover:text-primary"
                            onClick={() => navigate('/help')}
                        >
                            <TbArrowNarrowLeft />
                        </button>
                        {categoryLabel[topic] || topic}
                    </h4>
                </div>
            )}
            {data?.map((article, index) => (
                <ArticleItem
                    key={article.id}
                    id={article.id}
                    category={article.category}
                    title={article.title}
                    timeToRead={article.timeToRead}
                    viewCount={article.viewCount}
                    commentCount={article.commentCount}
                    isLastChild={!isLastChild(data, index)}
                />
            ))}
        </div>
    )
}

export default ArticleList
