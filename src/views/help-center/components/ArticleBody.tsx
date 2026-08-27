import ReactHtmlParser from 'html-react-parser'
import type { GetSupportHubArticleResponse } from '../types'

type ArticleBodyProps = {
    data: GetSupportHubArticleResponse
}

const ArticleBody = ({ data }: ArticleBodyProps) => {
    return (
        <>
            <h3>{data.title}</h3>
            {data.previewText ? (
                <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                    {data.previewText}
                </p>
            ) : null}
            <div className="prose dark:prose-invert mt-8 max-w-none prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:mt-2 [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_h4]:!text-gray-900 [&_h5]:!text-gray-900 [&_h6]:!text-gray-900 dark:[&_h1]:!text-gray-100 dark:[&_h2]:!text-gray-100 dark:[&_h3]:!text-gray-100 dark:[&_h4]:!text-gray-100 dark:[&_h5]:!text-gray-100 dark:[&_h6]:!text-gray-100 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 [&_img]:block">
                {ReactHtmlParser(data.content || '')}
            </div>
        </>
    )
}

export default ArticleBody
