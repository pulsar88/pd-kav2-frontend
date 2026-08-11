import { useEffect, useRef, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import uniqueId from 'lodash/uniqueId'
import acronym from '@/utils/acronym'
import type { GetSupportHubArticleResponse } from '../types'

type EditArticleHeaderProps = Pick<
    GetSupportHubArticleResponse,
    'title' | 'tags' | 'authors' | 'updateTime'
> & {
    onTitleChange: (title: string) => void
    onTagsChange: (tags: { id: string; label: string }[]) => void
}

const EditArticleHeader = ({
    title,
    authors,
    updateTime,
    tags = [],
    onTitleChange,
    onTagsChange,
}: EditArticleHeaderProps) => {
    const [articleTags, setArticleTags] = useState(tags)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setArticleTags(tags)
    }, [tags])

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.value = ''
        }
    }, [articleTags])

    return (
        <div>
            <input
                className="heading-text h3 block w-full bg-transparent p-2 outline-hidden ring-0"
                placeholder="Заголовок статьи"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
            />
            <div className="mt-3 flex flex-col gap-6 border-t border-gray-200 py-6 dark:border-gray-700">
                <div className="mb-2 flex items-center">
                    <div className="min-w-[150px] font-semibold">Автор:</div>
                    {authors.length > 0 ? (
                        <div className="flex items-center gap-2">
                            <Avatar
                                size={25}
                                src={authors[0].img || undefined}
                                className="bg-primary/15 text-primary"
                            >
                                {acronym(authors[0].name)}
                            </Avatar>
                            <span className="heading-text font-bold">
                                {authors[0].name}
                            </span>
                        </div>
                    ) : null}
                </div>
                <div className="mb-2 flex items-center">
                    <div className="min-w-[150px] font-semibold">
                        Обновлено:
                    </div>
                    <span className="heading-text font-bold">{updateTime}</span>
                </div>
                <div className="mb-2 flex items-center">
                    <div className="min-w-[150px] font-semibold">Теги:</div>
                    <div className="flex flex-wrap items-center gap-2">
                        {articleTags.map((tag) => (
                            <Tag key={tag.id}>{tag.label}</Tag>
                        ))}
                        <input
                            ref={inputRef}
                            className="heading-text block bg-transparent py-2 text-sm outline-hidden ring-0"
                            type="text"
                            placeholder="Добавить тег"
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    const eventTarget =
                                        event.target as HTMLInputElement
                                    const label = eventTarget.value.trim()
                                    if (!label) return
                                    const next = [
                                        ...articleTags,
                                        {
                                            id: uniqueId('article-tag-'),
                                            label,
                                        },
                                    ]
                                    setArticleTags(next)
                                    onTagsChange(next)
                                    inputRef.current?.blur()
                                }

                                if (
                                    event.key === 'Backspace' &&
                                    (event.target as HTMLInputElement).value
                                        .length === 0
                                ) {
                                    const next = articleTags.slice(0, -1)
                                    setArticleTags(next)
                                    onTagsChange(next)
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditArticleHeader
