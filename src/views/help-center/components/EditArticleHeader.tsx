import Tag from '@/components/ui/Tag'
import { usePublicationKind } from '../publicationKind'

type EditArticleHeaderProps = {
    title: string
    previewText: string
    onTitleChange: (title: string) => void
    onPreviewTextChange: (previewText: string) => void
    isDraft?: boolean
}

const EditArticleHeader = ({
    title,
    previewText,
    onTitleChange,
    onPreviewTextChange,
    isDraft,
}: EditArticleHeaderProps) => {
    const kind = usePublicationKind()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <input
                    className="heading-text h3 block w-full bg-transparent p-2 outline-hidden ring-0"
                    placeholder={`Заголовок ${kind.itemNameGenitive}`}
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                />
                {isDraft ? (
                    <Tag className="shrink-0 text-amber-600 bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-700/50 font-semibold text-xs">
                        Черновик
                    </Tag>
                ) : null}
            </div>
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <textarea
                    className="heading-text block max-h-[200px] min-h-[64px] w-full resize-y overflow-y-auto bg-transparent p-2 text-base outline-hidden ring-0"
                    placeholder={`Краткое описание ${kind.itemNameGenitive}`}
                    value={previewText}
                    onChange={(e) => onPreviewTextChange(e.target.value)}
                />
            </div>
        </div>
    )
}

export default EditArticleHeader
