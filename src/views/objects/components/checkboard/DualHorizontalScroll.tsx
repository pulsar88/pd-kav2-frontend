import { useEffect, useRef, type ReactNode, type UIEvent } from 'react'

type DualHorizontalScrollProps = {
    children: ReactNode
    className?: string
}

const DualHorizontalScroll = ({
    children,
    className,
}: DualHorizontalScrollProps) => {
    const topRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const spacerRef = useRef<HTMLDivElement>(null)
    const syncing = useRef(false)

    useEffect(() => {
        const content = contentRef.current
        const spacer = spacerRef.current
        if (!content || !spacer) return

        const syncWidth = () => {
            spacer.style.width = `${content.scrollWidth}px`
        }

        syncWidth()

        const observer = new ResizeObserver(syncWidth)
        observer.observe(content)
        return () => observer.disconnect()
    }, [children])

    const syncScroll = (
        source: HTMLDivElement,
        target: HTMLDivElement | null,
    ) => {
        if (!target || syncing.current) return
        syncing.current = true
        target.scrollLeft = source.scrollLeft
        requestAnimationFrame(() => {
            syncing.current = false
        })
    }

    const handleTopScroll = (event: UIEvent<HTMLDivElement>) => {
        syncScroll(event.currentTarget, bottomRef.current)
    }

    const handleBottomScroll = (event: UIEvent<HTMLDivElement>) => {
        syncScroll(event.currentTarget, topRef.current)
    }

    return (
        <div className={`min-w-0 max-w-full overflow-hidden ${className || ''}`}>
            <div
                ref={topRef}
                className="checkboard-scroll mb-1 max-w-full overflow-x-auto overflow-y-hidden"
                style={{ height: 14 }}
                onScroll={handleTopScroll}
            >
                <div ref={spacerRef} style={{ height: 1 }} />
            </div>
            <div
                ref={bottomRef}
                className="checkboard-scroll max-w-full overflow-x-auto overflow-y-hidden pb-2"
                onScroll={handleBottomScroll}
            >
                <div ref={contentRef} className="flex w-max items-start gap-4">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default DualHorizontalScroll
