import {
    ImageSlide,
    isImageSlide,
    type RenderSlideProps,
} from 'yet-another-react-lightbox'
import { hexToRgba } from '@/utils/hetToRgba'

export const FloorPlanPathOverlay = ({
    path,
    width,
    height,
    color = '#3b82f6',
}: {
    path: string
    width: number
    height: number
    color: string
}) => (
    <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
    >
        <path d={path} fill={hexToRgba(color)} stroke={color} strokeWidth={4} />
    </svg>
)

export const FloorPlanGallerySlide = ({
    slide,
    offset,
    rect,
    floorPath,
    color,
}: RenderSlideProps & {
    floorPath: string
    color: string
}) => {
    if (!isImageSlide(slide)) {
        return null
    }

    const hasSize = Boolean(slide.width && slide.height)

    return (
        <div
            style={{
                position: 'relative',
                ...(hasSize
                    ? {
                          maxWidth: `min(${slide.width}px, 100%)`,
                          maxHeight: `min(${slide.height}px, 100%)`,
                          aspectRatio: `${slide.width} / ${slide.height}`,
                      }
                    : null),
            }}
        >
            <ImageSlide
                slide={slide}
                offset={offset}
                rect={rect}
                style={{
                    display: 'block',
                    ...(hasSize
                        ? {
                              width: '100%',
                              height: 'auto',
                              maxWidth: undefined,
                              maxHeight: undefined,
                          }
                        : null),
                }}
            />
            {hasSize ? (
                <FloorPlanPathOverlay
                    path={floorPath}
                    width={slide.width!}
                    height={slide.height!}
                    color={color}
                />
            ) : null}
        </div>
    )
}

export const FLOOR_PLAN_HIGHLIGHT_COLOR = '#7ae061ff'

export const loadImageSize = (
    src: string,
): Promise<{ width: number; height: number } | null> =>
    new Promise((resolve) => {
        const image = new Image()
        image.onload = () => {
            resolve({
                width: image.naturalWidth,
                height: image.naturalHeight,
            })
        }
        image.onerror = () => resolve(null)
        image.src = src
    })
