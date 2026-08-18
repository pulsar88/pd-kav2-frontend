import { TbClock } from 'react-icons/tb'
import { useNavigate } from 'react-router'
import { usePublicationKind } from '../publicationKind'
import type { Article } from '../types'

type ArticleCardProps = Pick<
    Article,
    'id' | 'title' | 'previewText' | 'timeToRead'
>

const ArticleCard = ({
    id,
    title,
    previewText,
    timeToRead,
}: ArticleCardProps) => {
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const Icon = kind.icon

    return (
        <button
            type="button"
            className="group flex h-full flex-col rounded-xl border border-transparent bg-gray-100 p-6 text-left transition-colors hover:border-primary/40 hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/15"
            onClick={() => navigate(`${kind.basePath}/${id}`)}
        >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-colors group-hover:bg-primary/10 dark:bg-gray-800">
                <Icon className="text-2xl text-primary" />
            </div>
            <h4 className="mb-2 line-clamp-2 font-bold heading-text group-hover:text-primary">
                {title}
            </h4>
            {previewText ? (
                <p className="mb-4 line-clamp-3 flex-1 text-sm text-gray-600 dark:text-gray-300">
                    {previewText}
                </p>
            ) : (
                <div className="flex-1" />
            )}
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                <TbClock className="text-base" />
                <span>{timeToRead} мин чтения</span>
            </div>
        </button>
    )
}

export default ArticleCard
