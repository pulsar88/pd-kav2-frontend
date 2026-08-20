import { useRef, useState, useEffect, ReactNode } from 'react'
import classNames from 'classnames'
import type { HTMLAttributes } from 'react'

interface StickyFooterProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    stickyClass?: string
    defaultClass?: string
    children?: ReactNode | ((isSticky: boolean) => ReactNode)
}

/**
 * Sticky-футер без «прыжков»: position всегда sticky,
 * а IntersectionObserver смотрит на sentinel ниже блока,
 * а не на сам футер (иначе смена классов снова меняет intersection).
 */
const StickyFooter = (props: StickyFooterProps) => {
    const { children, className, stickyClass, defaultClass, ...rest } = props

    const [isSticky, setIsSticky] = useState(true)
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Sentinel виден → доскроллили до конца → «обычный» вид.
                // Sentinel скрыт → футер прилипает к низу → sticky-стили.
                setIsSticky(!entry.isIntersecting)
            },
            {
                threshold: 0,
            },
        )

        observer.observe(sentinel)

        return () => {
            observer.disconnect()
        }
    }, [])

    return (
        <>
            <div
                className={classNames(
                    'sticky bottom-0 z-10',
                    className,
                    isSticky ? stickyClass : defaultClass,
                )}
                {...rest}
            >
                {typeof children === 'function' ? children(isSticky) : children}
            </div>
            <div
                ref={sentinelRef}
                className="pointer-events-none h-px w-full"
                aria-hidden
            />
        </>
    )
}

export default StickyFooter
