import { TbClock, TbEdit, TbTrash } from 'react-icons/tb'
import { useNavigate } from 'react-router'
import Button from '@/components/ui/Button'
import { usePublicationKind } from '../publicationKind'
import type { Article } from '../types'

type ArticleCardProps = Pick<
    Article,
    'id' | 'title' | 'previewText' | 'timeToRead'
> & {
    canManage?: boolean
    onDelete?: (id: string) => void
}

const ArticleCard = ({
    id,
    title,
    previewText,
    timeToRead,
    canManage = false,
    onDelete,
}: ArticleCardProps) => {
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const Icon = kind.icon

    return (
        <div className="group flex h-full flex-col rounded-xl border border-transparent bg-gray-100 p-6 text-left transition-colors hover:border-primary/40 hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/15">
            <div className="mb-4 flex items-center justify-between gap-2">
                <button
                    type="button"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm outline-hidden transition-colors group-hover:bg-primary/10 dark:bg-gray-800"
                    onClick={() => navigate(`${kind.basePath}/${id}`)}
                >
                    <Icon className="text-2xl text-primary" />
                </button>
                {canManage ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                            type="button"
                            size="xs"
                            variant="plain"
                            icon={<TbEdit />}
                            className="border border-primary text-primary hover:bg-primary/10 hover:text-primary"
                            title="Редактировать"
                            onClick={() =>
                                navigate(`${kind.basePath}/${id}/edit`)
                            }
                        />
                        <Button
                            type="button"
                            size="xs"
                            variant="plain"
                            icon={<TbTrash />}
                            className="border border-error text-error hover:bg-error/10 hover:text-error"
                            title="Удалить"
                            onClick={() => onDelete?.(id)}
                        />
                    </div>
                ) : null}
            </div>
            <button
                type="button"
                className="flex min-h-0 flex-1 flex-col text-left outline-hidden"
                onClick={() => navigate(`${kind.basePath}/${id}`)}
            >
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
        </div>
    )
}

export default ArticleCard
