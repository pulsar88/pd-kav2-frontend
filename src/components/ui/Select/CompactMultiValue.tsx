import { components, type MultiValueProps, type GroupBase } from 'react-select'
import Tooltip from '../Tooltip'

export type CompactMultiValueProps<
    Option,
    IsMulti extends boolean = true,
    Group extends GroupBase<Option> = GroupBase<Option>,
> = MultiValueProps<Option, IsMulti, Group>

const CompactMultiValue = <
    Option,
    IsMulti extends boolean = true,
    Group extends GroupBase<Option> = GroupBase<Option>,
>(
    props: CompactMultiValueProps<Option, IsMulti, Group>,
) => {
    const { index, getValue } = props

    // Рендерим только первый выбранный элемент
    if (index !== 0) {
        return null
    }

    const allValues = getValue()
    const remaining = allValues.length - 1
    const remainingValues = allValues.slice(1)

    const firstLabel =
        typeof props.data === 'object' &&
        props.data !== null &&
        'label' in props.data
            ? String((props.data as { label: unknown }).label)
            : String(props.data ?? '')

    return (
        <div className="flex items-center gap-1 min-w-0 max-w-full">
            <div className="min-w-0 shrink" title={firstLabel}>
                <components.MultiValue {...props} />
            </div>
            {remaining > 0 ? (
                <Tooltip
                    title={
                        <div className="max-h-60 overflow-y-auto pr-1 text-xs">
                            <div className="font-semibold text-gray-300 dark:text-gray-400 mb-1">
                                Еще выбрано ({remaining}):
                            </div>
                            <div className="flex flex-col gap-0.5 text-white">
                                {remainingValues.map((item, idx) => {
                                    const label =
                                        typeof item === 'object' &&
                                        item !== null &&
                                        'label' in item
                                            ? String((item as { label: unknown }).label)
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
                    <span className="shrink-0 select-none rounded-md bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200 cursor-default">
                        +{remaining}
                    </span>
                </Tooltip>
            ) : null}
        </div>
    )
}

export default CompactMultiValue
