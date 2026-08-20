type EditArticleHeaderProps = {
    title: string
    previewText: string
    onTitleChange: (title: string) => void
    onPreviewTextChange: (previewText: string) => void
}

import { usePublicationKind } from '../publicationKind'

const EditArticleHeader = ({
    title,
    previewText,
    onTitleChange,
    onPreviewTextChange,
}: EditArticleHeaderProps) => {
    const kind = usePublicationKind()

    return (
        <div className="flex flex-col gap-4">
            <input
                className="heading-text h3 block w-full bg-transparent p-2 outline-hidden ring-0"
                placeholder={`Заголовок ${kind.itemNameGenitive}`}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
            />
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <label className="mb-2 block px-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Превью текст
                </label>
                <textarea
                    className="heading-text block min-h-[96px] w-full resize-y bg-transparent p-2 text-base outline-hidden ring-0"
                    placeholder="Краткое описание для карточки и шапки"
                    value={previewText}
                    onChange={(e) => onPreviewTextChange(e.target.value)}
                />
            </div>
        </div>
    )
}

export default EditArticleHeader
