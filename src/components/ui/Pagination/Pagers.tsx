import { useState, useEffect, useCallback, useMemo } from 'react'
import classNames from 'classnames'
import {
    HiOutlineChevronDoubleLeft,
    HiOutlineDotsHorizontal,
    HiChevronDoubleRight,
} from 'react-icons/hi'

const PAGER_COUNT_DEFAULT = 5

type More = 'nextMore' | 'prevMore'

type MoreProps = {
    className: string
    onArrow: (more: More) => void
}

const NextMore = ({ className, onArrow }: MoreProps) => {
    const [quickNextArrowIcon, setQuickNextArrowIcon] = useState(false)

    return (
        <li
            className={className}
            role="presentation"
            onMouseEnter={() => {
                setQuickNextArrowIcon(true)
            }}
            onMouseLeave={() => {
                setQuickNextArrowIcon(false)
            }}
            onClick={() => onArrow('nextMore')}
        >
            {quickNextArrowIcon ? (
                <HiChevronDoubleRight />
            ) : (
                <HiOutlineDotsHorizontal />
            )}
        </li>
    )
}

const PrevMore = ({ className, onArrow }: MoreProps) => {
    const [quickPrevArrowIcon, setQuickPrevArrowIcon] = useState(false)

    return (
        <li
            className={className}
            role="presentation"
            onMouseEnter={() => {
                setQuickPrevArrowIcon(true)
            }}
            onMouseLeave={() => {
                setQuickPrevArrowIcon(false)
            }}
            onClick={() => onArrow('prevMore')}
        >
            {quickPrevArrowIcon ? (
                <HiOutlineChevronDoubleLeft />
            ) : (
                <HiOutlineDotsHorizontal />
            )}
        </li>
    )
}

type PagersProps = {
    pageCount: number
    currentPage: number
    pagerCount?: number
    pagerClass: {
        default: string
        inactive: string
        active: string
        disabled: string
    }
    onChange: (page: number) => void
}

const Pagers = (props: PagersProps) => {
    const {
        pageCount,
        currentPage,
        onChange,
        pagerClass,
        pagerCount = PAGER_COUNT_DEFAULT,
    } = props

    const [showPrevMore, setShowPrevMore] = useState(false)
    const [showNextMore, setShowNextMore] = useState(false)

    useEffect(() => {
        if (pageCount > pagerCount) {
            if (currentPage > pagerCount - 2) {
                setShowPrevMore(true)
            }
            if (currentPage < pageCount - 2) {
                setShowNextMore(true)
            }
            if (currentPage >= pageCount - 3 && currentPage <= pageCount) {
                setShowNextMore(false)
            }
            if (currentPage >= 1 && currentPage <= Math.max(2, pagerCount - 3)) {
                setShowPrevMore(false)
            }
        } else {
            setShowPrevMore(false)
            setShowNextMore(false)
        }
    }, [currentPage, pageCount, pagerCount])

    const onPagerClick = (
        value: number,
        e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    ) => {
        e.preventDefault()
        let newPage = value

        if (newPage < 1) {
            newPage = 1
        }
        if (newPage > pageCount) {
            newPage = pageCount
        }

        if (newPage !== currentPage) {
            onChange(newPage)
        }
    }

    const jumpStep = Math.max(2, pagerCount - 2)

    const onArrowClick = useCallback(
        (e: More) => {
            let newPage = currentPage
            if (e === 'nextMore') {
                newPage = currentPage + jumpStep
            }
            if (e === 'prevMore') {
                newPage = currentPage - jumpStep
            }
            onChange(newPage)
        },
        [currentPage, onChange, jumpStep],
    )

    const getPages = useMemo(() => {
        const pagerArray = []
        if (showPrevMore && !showNextMore) {
            const startPage = pageCount - (pagerCount - 2)
            for (let i = startPage; i < pageCount; i++) {
                pagerArray.push(i)
            }
        } else if (!showPrevMore && showNextMore) {
            for (let i = 2; i < pagerCount; i++) {
                pagerArray.push(i)
            }
        } else if (showPrevMore && showNextMore) {
            const offset = Math.max(0, Math.floor(pagerCount / 2) - 1)
            const maxRange =
                currentPage >= pageCount - 2 && currentPage <= pageCount
            for (
                let i = currentPage - offset;
                i <= currentPage + (maxRange ? 0 : offset);
                i++
            ) {
                if (i > 1 && i < pageCount) {
                    pagerArray.push(i)
                }
            }
        } else {
            for (let i = 2; i < pageCount; i++) {
                pagerArray.push(i)
            }
        }
        if (pagerArray.length > pagerCount) {
            return []
        }

        return pagerArray
    }, [showPrevMore, showNextMore, currentPage, pageCount, pagerCount])

    const getPagerClass = (index: number) => {
        return classNames(
            pagerClass.default,
            currentPage === index ? pagerClass.active : pagerClass.inactive,
        )
    }

    return (
        <ul>
            {pageCount > 0 && (
                <li
                    className={getPagerClass(1)}
                    role="presentation"
                    onClick={(e) => onPagerClick(1, e)}
                >
                    1
                </li>
            )}
            {showPrevMore && (
                <PrevMore
                    className={classNames(
                        pagerClass.default,
                        pagerClass.inactive,
                    )}
                    onArrow={(arrow) => onArrowClick(arrow)}
                />
            )}
            {getPages.map((pager, index) => {
                return (
                    <li
                        key={index}
                        className={getPagerClass(pager)}
                        role="presentation"
                        onClick={(e) => onPagerClick(pager, e)}
                    >
                        {pager}
                    </li>
                )
            })}
            {showNextMore && (
                <NextMore
                    className={classNames(
                        pagerClass.default,
                        pagerClass.inactive,
                    )}
                    onArrow={(arrow) => onArrowClick(arrow)}
                />
            )}
            {pageCount > 1 && (
                <li
                    className={getPagerClass(pageCount)}
                    role="presentation"
                    onClick={(e) => onPagerClick(pageCount, e)}
                >
                    {pageCount}
                </li>
            )}
        </ul>
    )
}

export default Pagers
