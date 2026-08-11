import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import ReactHtmlParser from 'html-react-parser'
import type { GetSupportHubArticleResponse } from '../types'

type ArticleBodyProps = {
    data: GetSupportHubArticleResponse
}

const ArticleBody = ({ data }: ArticleBodyProps) => {
    return (
        <>
            <h3>{data.title}</h3>
            <div className="mt-6 flex items-center gap-4">
                <UsersAvatarGroup
                    avatarProps={{ size: 40 }}
                    users={data.authors || []}
                />
                <div className="text-xs">
                    <div className="mb-1">
                        Автор:{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {data.createdBy}
                        </span>
                    </div>
                    <div>
                        <span>Обновлено: {data.updateTime}</span>
                        <span className="mx-2">•</span>
                        <span>{data.timeToRead} мин чтения</span>
                        <span className="mx-2">•</span>
                        <span>{data.viewCount} просмотров</span>
                    </div>
                </div>
            </div>
            <div className="prose dark:prose-invert mt-8 max-w-none prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:mt-2 [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_h4]:!text-gray-900 [&_h5]:!text-gray-900 [&_h6]:!text-gray-900 dark:[&_h1]:!text-gray-100 dark:[&_h2]:!text-gray-100 dark:[&_h3]:!text-gray-100 dark:[&_h4]:!text-gray-100 dark:[&_h5]:!text-gray-100 dark:[&_h6]:!text-gray-100">
                {ReactHtmlParser(data.content || '')}
            </div>
        </>
    )
}

export default ArticleBody
