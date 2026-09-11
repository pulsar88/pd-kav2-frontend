import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import Select from '@/components/ui/Select'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbColumns, TbSearch } from 'react-icons/tb'
import type { ChangeEvent } from 'react'
import {
    FIXATION_COLUMN_OPTIONS,
    type FixationColumnId,
    type FixationColumnVisibility,
} from '../columnVisibility'
import { FIXATION_STATUS_ORDER } from '../dashboard.constants'
import type { FixationStatus } from '../types'
import { fixationStatusMap } from '../utils'

type StatusOption = {
    value: FixationStatus
    label: string
}

const STATUS_OPTIONS: StatusOption[] = FIXATION_STATUS_ORDER.map((status) => ({
    value: status,
    label: fixationStatusMap[status].label,
}))

type FixationsTableToolsProps = {
    columnVisibility: FixationColumnVisibility
    statusFilter?: FixationStatus
    onSearchChange: (value: string) => void
    onStatusFilterChange: (status?: FixationStatus) => void
    onColumnVisibilityChange: (
        columnId: FixationColumnId,
        visible: boolean,
    ) => void
}

const FixationsTableTools = ({
    columnVisibility,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
    onColumnVisibilityChange,
}: FixationsTableToolsProps) => {
    const visibleCount = FIXATION_COLUMN_OPTIONS.filter(
        (column) => columnVisibility[column.id],
    ).length

    const selectedStatus =
        STATUS_OPTIONS.find((item) => item.value === statusFilter) ?? null

    return (
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
                <DebouceInput
                    placeholder="Поиск по фиксациям..."
                    suffix={<TbSearch className="text-lg" />}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onSearchChange(e.target.value)
                    }
                />
            </div>
            <div className="w-full shrink-0 lg:w-56">
                <Select<StatusOption, false>
                    isClearable
                    isSearchable={false}
                    placeholder="Все статусы"
                    options={STATUS_OPTIONS}
                    value={selectedStatus}
                    onChange={(option) =>
                        onStatusFilterChange(option?.value)
                    }
                />
            </div>
            <Dropdown
                placement="bottom-end"
                renderTitle={
                    <Button
                        type="button"
                        icon={<TbColumns />}
                        className="shrink-0"
                    >
                        Столбцы
                    </Button>
                }
            >
                <Dropdown.Item variant="header">
                    <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Отображаемые столбцы
                    </div>
                </Dropdown.Item>
                {FIXATION_COLUMN_OPTIONS.map((column) => {
                    const checked = columnVisibility[column.id]
                    const disableUncheck = checked && visibleCount <= 1

                    return (
                        <Dropdown.Item
                            key={column.id}
                            variant="custom"
                            onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                            }}
                        >
                            <label
                                className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <Checkbox
                                    checked={checked}
                                    disabled={disableUncheck}
                                    onChange={(value) =>
                                        onColumnVisibilityChange(
                                            column.id,
                                            value,
                                        )
                                    }
                                />
                                <span className="text-sm">{column.label}</span>
                            </label>
                        </Dropdown.Item>
                    )
                })}
            </Dropdown>
        </div>
    )
}

export default FixationsTableTools
