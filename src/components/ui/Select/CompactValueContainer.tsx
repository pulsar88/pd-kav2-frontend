import React, {
    useRef,
    useState,
    useLayoutEffect,
    type ReactNode,
} from 'react'
import {
    components,
    type ValueContainerProps,
    type GroupBase,
} from 'react-select'
import Tooltip from '../Tooltip'

export type CompactValueContainerProps<
    Option,
    IsMulti extends boolean = true,
    Group extends GroupBase<Option> = GroupBase<Option>,
> = ValueContainerProps<Option, IsMulti, Group>

const CompactValueContainer = <
    Option,
    IsMulti extends boolean = true,
    Group extends GroupBase<Option> = GroupBase<Option>,
>(
    props: CompactValueContainerProps<Option, IsMulti, Group>,
) => {
    const { children, hasValue, isMulti } = props

    if (!hasValue || !isMulti) {
        return (
            <components.ValueContainer {...props}>
                {children}
            </components.ValueContainer>
        )
    }

    const values = props.getValue()
    const totalCount = values.length

    if (totalCount === 0) {
        return (
            <components.ValueContainer {...props}>
                {children}
            </components.ValueContainer>
        )
    }

    let multiValueChildren: ReactNode[] = []
    let otherChildren: ReactNode[] = []

    if (Array.isArray(children) && Array.isArray(children[0])) {
        multiValueChildren = children[0]
        otherChildren = children.slice(1)
    } else {
        const flattened = React.Children.toArray(children)
        multiValueChildren = flattened.slice(0, totalCount)
        otherChildren = flattened.slice(totalCount)
    }

    const actualCount = Math.min(totalCount, multiValueChildren.length)

    const containerRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<HTMLDivElement>(null)
    const measureBadgeRef = useRef<HTMLDivElement>(null)
    const [visibleCount, setVisibleCount] = useState<number>(actualCount)

    const valuesKey = values
        .map((v: unknown) => {
            if (typeof v === 'object' && v !== null) {
                const item = v as Record<string, unknown>
                return String(item.value ?? item.id ?? item.label ?? '')
            }
            return String(v ?? '')
        })
        .join(',')

    const updateVisibleCount = () => {
        if (!containerRef.current || !measureRef.current) return

        const containerWidth = containerRef.current.clientWidth
        if (containerWidth <= 0) return

        const measureChildren = measureRef.current.children
        if (!measureChildren || measureChildren.length === 0) return

        const badgeElement = measureBadgeRef.current
        const badgeWidth = badgeElement
            ? badgeElement.getBoundingClientRect().width
            : 52

        const inputValue = props.selectProps.inputValue || ''
        const reservedInputWidth = inputValue
            ? Math.max(30, inputValue.length * 9)
            : 6
        const availableWidth = containerWidth - reservedInputWidth
        const gap = 4

        const chipWidths: number[] = []
        for (let i = 0; i < actualCount; i++) {
            const chipEl = measureChildren[i] as HTMLElement
            if (chipEl) {
                chipWidths.push(chipEl.getBoundingClientRect().width)
            }
        }

        if (chipWidths.length === 0) return

        // 1. Проверяем, помещаются ли все чипы без бейджа
        let totalAllWidth = 0
        for (let i = 0; i < chipWidths.length; i++) {
            totalAllWidth += chipWidths[i] + (i > 0 ? gap : 0)
        }

        if (totalAllWidth <= availableWidth) {
            setVisibleCount((prev) => (prev === actualCount ? prev : actualCount))
            return
        }

        // 2. Иначе ищем максимальное число k чипов, помещающихся вместе с бейджем «еще N»
        let fittedCount = 1
        for (let k = actualCount - 1; k >= 1; k--) {
            let widthWithBadge = badgeWidth + gap
            for (let i = 0; i < k; i++) {
                widthWithBadge += chipWidths[i] + (i > 0 ? gap : 0)
            }
            if (widthWithBadge <= availableWidth) {
                fittedCount = k
                break
            }
        }

        setVisibleCount((prev) => (prev === fittedCount ? prev : fittedCount))
    }

    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return

        updateVisibleCount()

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => {
                updateVisibleCount()
            })
            observer.observe(el)

            return () => {
                observer.disconnect()
            }
        }
    }, [valuesKey, actualCount, props.selectProps.inputValue])

    const safeVisibleCount = Math.min(
        Math.max(1, visibleCount),
        actualCount,
    )
    const remainingCount = actualCount - safeVisibleCount
    const hiddenValues = values.slice(safeVisibleCount)

    return (
        <components.ValueContainer {...props}>
            <div
                ref={containerRef}
                className="flex items-center min-w-0 flex-1 w-full overflow-hidden gap-1 flex-nowrap"
            >
                {multiValueChildren.slice(0, safeVisibleCount).map((child, i) => {
                    const optionItem = values[i]
                    const label =
                        typeof optionItem === 'object' &&
                        optionItem !== null &&
                        'label' in optionItem
                            ? String((optionItem as { label: unknown }).label)
                            : String(optionItem ?? '')
                    const itemKey =
                        typeof optionItem === 'object' && optionItem !== null
                            ? String(
                                  (optionItem as Record<string, unknown>)
                                      .value ??
                                      (optionItem as Record<string, unknown>)
                                          .id ??
                                      label,
                              )
                            : String(optionItem ?? i)

                    return (
                        <div
                            key={`vis-${itemKey}`}
                            title={label}
                            className={
                                safeVisibleCount === 1
                                    ? 'min-w-0 shrink flex items-center max-w-full'
                                    : 'shrink-0 flex items-center min-w-0'
                            }
                        >
                            {child}
                        </div>
                    )
                })}
                {remainingCount > 0 && (
                    <Tooltip
                        title={
                            <div className="max-h-60 overflow-y-auto pr-1 text-xs">
                                <div className="mb-1 font-semibold text-gray-300 dark:text-gray-400">
                                    Еще выбрано ({remainingCount}):
                                </div>
                                <div className="flex flex-col gap-0.5 text-white">
                                    {hiddenValues.map((item, idx) => {
                                        const label =
                                            typeof item === 'object' &&
                                            item !== null &&
                                            'label' in item
                                                ? String(
                                                      (
                                                          item as {
                                                              label: unknown
                                                          }
                                                      ).label,
                                                  )
                                                : String(item ?? '')
                                        return (
                                            <div
                                                key={idx}
                                                className="whitespace-nowrap"
                                            >
                                                {label}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        }
                    >
                        <span className="shrink-0 select-none rounded-md bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                            еще {remainingCount}
                        </span>
                    </Tooltip>
                )}
                <div className="shrink-0 flex items-center min-w-[2px]">
                    {otherChildren}
                </div>
            </div>

            {/* Скрытый контейнер для точного измерения ширины чипов в DOM */}
            <div
                ref={measureRef}
                aria-hidden="true"
                className="pointer-events-none invisible absolute left-0 top-0 flex flex-nowrap items-center gap-1"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    height: 0,
                    overflow: 'hidden',
                    zIndex: -9999,
                }}
            >
                {multiValueChildren.map((child, i) => {
                    const optionItem = values[i]
                    const itemKey =
                        typeof optionItem === 'object' && optionItem !== null
                            ? String(
                                  (optionItem as Record<string, unknown>)
                                      .value ??
                                      (optionItem as Record<string, unknown>)
                                          .id ??
                                      i,
                              )
                            : String(optionItem ?? i)

                    return (
                        <div
                            key={`meas-${itemKey}`}
                            className="shrink-0 flex items-center"
                        >
                            {child}
                        </div>
                    )
                })}
                <div
                    ref={measureBadgeRef}
                    className="shrink-0 flex items-center"
                >
                    <span className="select-none rounded-md bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        еще {Math.max(1, actualCount - 1)}
                    </span>
                </div>
            </div>
        </components.ValueContainer>
    )
}

export default CompactValueContainer
