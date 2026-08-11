import ArticleItem from './ArticleItem'
import { categoryIcon } from '../utils'
import { apiGetSupportHubCategories } from '@/services/HelpCenterService'
import isLastChild from '@/utils/isLastChild'
import useSWR from 'swr'
import { useNavigate } from 'react-router'
import type { GetSupportHubCategoriesResponse } from '../types'

const Categories = () => {
    const navigate = useNavigate()
    const { data } = useSWR(
        ['/helps/categories'],
        () => apiGetSupportHubCategories<GetSupportHubCategoriesResponse>(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    return (
        <div className="flex flex-col gap-16">
            {data?.categories.map((category) => (
                <div key={category.name}>
                    <h3 className="mb-6">{category.name}</h3>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {category.topics.map((topic) => (
                            <div
                                key={topic.id}
                                className="group cursor-pointer rounded-xl border border-transparent bg-gray-100 p-8 transition-colors hover:border-primary/40 hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/15"
                                role="button"
                                onClick={() => navigate(`/help/${topic.id}`)}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className="rounded-full bg-white p-4 shadow-sm transition-colors dark:bg-gray-800 group-hover:bg-primary/10">
                                        <span className="text-2xl text-primary">
                                            {categoryIcon[topic.id]}
                                        </span>
                                    </div>
                                    <h4 className="mt-3 font-bold heading-text">
                                        {topic.name}
                                    </h4>
                                    <p className="min-h-[50px] max-w-[250px] text-center text-gray-600 dark:text-gray-300">
                                        {topic.description}
                                    </p>
                                    <div className="font-bold text-primary">
                                        {topic.articleCounts}{' '}
                                        {topic.articleCounts === 1
                                            ? 'статья'
                                            : topic.articleCounts < 5
                                              ? 'статьи'
                                              : 'статей'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {data && (
                <div>
                    <h3 className="mb-6">Популярные статьи</h3>
                    <div>
                        {data.popularArticles.map((article, index) => (
                            <ArticleItem
                                key={article.id}
                                id={article.id}
                                category={article.category}
                                title={article.title}
                                timeToRead={article.timeToRead}
                                viewCount={article.viewCount}
                                commentCount={article.commentCount}
                                isLastChild={
                                    !isLastChild(data.popularArticles, index)
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Categories
