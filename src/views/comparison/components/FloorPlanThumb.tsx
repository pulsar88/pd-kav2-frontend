import { useState } from 'react'
import classNames from 'classnames'
import { TbZoomIn } from 'react-icons/tb'

export const FloorPlanPathOverlay = ({
    path,
    width,
    height,
    color = '#63cba5',
}: {
    path: string
    width: number
    height: number
    color?: string
}) => (
    <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
    >
        <path
            d={path}
            fill="rgba(99, 203, 165, 0.4)"
            stroke={color}
            strokeWidth={4}
        />
    </svg>
)

type FloorPlanThumbProps = {
    src: string
    path?: string
    alt: string
    className?: string
    onPreview: () => void
}

/**
 * Миниатюра плана этажа с векторной разметкой помещения.
 *
 * Ключевой момент: оверлей (SVG c viewBox = naturalWidth/naturalHeight)
 * лежит внутри ВНУТРЕННЕЙ обёртки без паддингов и занимает ровно её бокс,
 * в котором позиционируется изображение. Если привязать SVG к внешнему
 * контейнеру (у которого есть padding), его бокс больше бокса картинки —
 * масштаб пути («meet») не совпадает с масштабом изображения
 * («object-contain»), и разметка съезжает.
 */
const FloorPlanThumb = ({
    src,
    path,
    alt,
    className,
    onPreview,
}: FloorPlanThumbProps) => {
    const [size, setSize] = useState<{
        width: number
        height: number
    } | null>(null)

    return (
        <div
            className={classNames(
                'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-white',
                className,
            )}
            onClick={onPreview}
        >
            <div className="relative flex h-full w-full items-center justify-center">
                <img
                    src={src}
                    alt={alt}
                    className="max-h-full max-w-full object-contain"
                    onLoad={(event) => {
                        const img = event.currentTarget
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                            setSize({
                                width: img.naturalWidth,
                                height: img.naturalHeight,
                            })
                        }
                    }}
                />
                {path && size ? (
                    <FloorPlanPathOverlay
                        path={path}
                        width={size.width}
                        height={size.height}
                    />
                ) : null}
            </div>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                <TbZoomIn className="text-xl" />
            </span>
        </div>
    )
}

export default FloorPlanThumb
