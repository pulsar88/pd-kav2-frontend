import { useMemo } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import { TbFilter, TbCheck } from 'react-icons/tb'

export type NotificationFilterItem = {
    label: string
    value: string
}

type LogActionProps = {
    filterItems: NotificationFilterItem[]
    selectedFilters: string[]
    onFilterChange: (value: string) => void
}

const LogAction = ({
    filterItems,
    selectedFilters = [],
    onFilterChange,
}: LogActionProps) => {
    const allUnchecked = useMemo(() => {
        return !selectedFilters.some((value) =>
            filterItems.map((item) => item.value).includes(value),
        )
    }, [filterItems, selectedFilters])

    return (
        <Dropdown
            placement="bottom-end"
            renderTitle={
                <button
                    className="close-button p-2.5! button-press-feedback"
                    type="button"
                >
                    <TbFilter />
                </button>
            }
        >
            {filterItems.map((item) => (
                <Dropdown.Item
                    key={item.value}
                    eventKey={item.value}
                    onClick={() => onFilterChange(item.value)}
                >
                    {!allUnchecked && (
                        <div className="flex justify-center w-[20px]">
                            {selectedFilters.includes(item.value) && (
                                <TbCheck className="text-primary text-lg" />
                            )}
                        </div>
                    )}
                    <span>{item.label}</span>
                </Dropdown.Item>
            ))}
        </Dropdown>
    )
}

export default LogAction
