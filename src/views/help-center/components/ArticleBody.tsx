import { useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import ReactHtmlParser from 'html-react-parser'
import ImageGallery from '@/components/shared/ImageGallery'
import { richTextTableClass } from '@/components/shared/RichTextEditor/tableStyles'
import { wrapTablesInScrollContainers } from '../helpCenterContent'
import type { GetSupportHubArticleResponse } from '../types'

type ArticleBodyProps = {
    data: GetSupportHubArticleResponse
}

const collectImageSrcs = (html: string) => {
    if (!html) return [] as string[]

    const matches = html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)
    const srcs: string[] = []
    for (const match of matches) {
        const src = match[1]?.trim()
        if (src) {
            srcs.push(src)
        }
    }
    return srcs
}

const ArticleBody = ({ data }: ArticleBodyProps) => {
    const contentHtml = wrapTablesInScrollContainers(data.content || '')
    const imageSrcs = useMemo(
        () => collectImageSrcs(contentHtml),
        [contentHtml],
    )
    const [lightboxIndex, setLightboxIndex] = useState(-1)

    const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target
        if (!(target instanceof HTMLImageElement)) {
            return
        }

        const src =
            target.getAttribute('src') || target.currentSrc || target.src
        if (!src) {
            return
        }

        const index = imageSrcs.findIndex(
            (item) =>
                item === src ||
                src.endsWith(item) ||
                item.endsWith(src) ||
                target.src.includes(item),
        )
        if (index < 0) {
            return
        }

        event.preventDefault()
        setLightboxIndex(index)
    }

    return (
        <>
            <header className="border-b border-gray-200 pb-6 dark:border-gray-700">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl dark:text-gray-50">
                    {data.title}
                </h1>
                {data.previewText ? (
                    <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
                        {data.previewText}
                    </p>
                ) : null}
            </header>

            <div
                role="presentation"
                className={`article-content prose dark:prose-invert max-w-full min-w-0 overflow-visible rounded-xl bg-white p-6 text-gray-800 prose-headings:text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:prose-headings:text-gray-100 prose-p:mt-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 [&_img]:block [&_img]:border [&_img]:border-gray-600 [&_img]:cursor-zoom-in [&_img]:transition-[filter,box-shadow] [&_img:hover]:brightness-[0.98] [&_img:hover]:ring-2 [&_img:hover]:ring-primary/30 ${richTextTableClass}`}
                onClick={handleContentClick}
            >
                {ReactHtmlParser(contentHtml)}
            </div>

            <ImageGallery
                index={lightboxIndex}
                slides={imageSrcs.map((src) => ({ src }))}
                onClose={() => setLightboxIndex(-1)}
            />
        </>
    )
}

export default ArticleBody
