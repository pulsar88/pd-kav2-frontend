import {
    useEffect,
    useRef,
    type CSSProperties,
    type ReactNode,
    type UIEvent,
} from 'react'

type DualHorizontalScrollProps = {
    children: ReactNode
    className?: string
    zoom?: number
    onZoomChange?: (zoom: number) => void
    zoomMin?: number
    zoomMax?: number
    zoomStep?: number
}

const DEFAULT_ZOOM_MIN = 0.3
const DEFAULT_ZOOM_MAX = 1.5
const DEFAULT_ZOOM_STEP = 0.1

const DualHorizontalScroll = ({
    children,
    className,
    zoom = 1,
    onZoomChange,
    zoomMin = DEFAULT_ZOOM_MIN,
    zoomMax = DEFAULT_ZOOM_MAX,
    zoomStep = DEFAULT_ZOOM_STEP,
}: DualHorizontalScrollProps) => {
    const topRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const spacerRef = useRef<HTMLDivElement>(null)
    const syncingFrom = useRef<'top' | 'bottom' | null>(null)
    const zoomRef = useRef(zoom)
    const onZoomChangeRef = useRef(onZoomChange)

    zoomRef.current = zoom
    onZoomChangeRef.current = onZoomChange

    useEffect(() => {
        const content = contentRef.current
        const spacer = spacerRef.current
        if (!content || !spacer) return

        const syncWidth = () => {
            // Keep unzoomed width in sync; the same CSS zoom is applied to both
            // the top spacer wrapper and the bottom content.
            spacer.style.width = `${content.scrollWidth}px`
        }

        syncWidth()
        const frame = window.requestAnimationFrame(syncWidth)
        const observer = new ResizeObserver(syncWidth)
        observer.observe(content)
        return () => {
            window.cancelAnimationFrame(frame)
            observer.disconnect()
        }
    }, [children, zoom])

    useEffect(() => {
        const scroller = bottomRef.current
        if (!scroller) return

        const handleWheel = (event: WheelEvent) => {
            // Only intercept Ctrl/Cmd+wheel for zoom. Leave vertical page scroll
            // to the browser so it feels the same as elsewhere on the page.
            if (!event.ctrlKey && !event.metaKey) return
            if (!onZoomChangeRef.current) return

            event.preventDefault()

            const direction = event.deltaY > 0 ? -zoomStep : zoomStep
            const next =
                Math.round(
                    Math.min(
                        zoomMax,
                        Math.max(zoomMin, zoomRef.current + direction),
                    ) * 10,
                ) / 10

            if (next !== zoomRef.current) {
                onZoomChangeRef.current(next)
            }
        }

        scroller.addEventListener('wheel', handleWheel, { passive: false })
        return () => scroller.removeEventListener('wheel', handleWheel)
    }, [zoomMin, zoomMax, zoomStep])

    const handleTopScroll = (event: UIEvent<HTMLDivElement>) => {
        // Ignore echo from programmatic sync triggered by the bottom scroller.
        if (syncingFrom.current === 'bottom') return
        const bottom = bottomRef.current
        if (!bottom) return
        syncingFrom.current = 'top'
        bottom.scrollLeft = event.currentTarget.scrollLeft
        syncingFrom.current = null
    }

    const handleBottomScroll = (event: UIEvent<HTMLDivElement>) => {
        if (syncingFrom.current === 'top') return
        const top = topRef.current
        if (!top) return
        syncingFrom.current = 'bottom'
        top.scrollLeft = event.currentTarget.scrollLeft
        syncingFrom.current = null
    }

    const zoomStyle = zoom !== 1 ? ({ zoom } as CSSProperties) : undefined

    return (
        <div className={`min-w-0 max-w-full overflow-hidden ${className || ''}`}>
            <div
                ref={topRef}
                className="checkboard-scroll mb-1 max-w-full overflow-x-auto overflow-y-hidden"
                style={{ height: 14 }}
                onScroll={handleTopScroll}
            >
                <div className="w-max" style={zoomStyle}>
                    <div ref={spacerRef} style={{ height: 1 }} />
                </div>
            </div>
            <div
                ref={bottomRef}
                className="checkboard-scroll max-w-full overflow-x-auto overflow-y-hidden pb-2"
                onScroll={handleBottomScroll}
            >
                <div
                    ref={contentRef}
                    className="flex w-max origin-top-left items-start gap-4"
                    style={zoomStyle}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}

export default DualHorizontalScroll
