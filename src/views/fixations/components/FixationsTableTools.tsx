import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import Select from '@/components/ui/Select'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbColumns, TbSearch } from 'react-icons/tb'
import type { ChangeEvent } from 'react'
import {
    getFixationColumnOptionsForAuthority,
    type FixationColumnId,
    type FixationColumnVisibility,
} from '../columnVisibility'
import { FIXATION_STATUS_ORDER } from '../dashboard.constants'
import type { FixationStatus } from '../types'
import { fixationStatusMap } from '../utils'

type FilterOption = { value: number; label: string }

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
    columnOptionsAuthority?: string[]
    statusFilter?: FixationStatus
    showAgencyFilter?: boolean
    showAgentFilter?: boolean
    agencyOptions?: FilterOption[]
    agentOptions?: FilterOption[]
    agencyId?: number
    agentId?: number
    onAgencyChange?: (option?: FilterOption | null) => void
    onAgentChange?: (value?: number) => void
    onAgencySearchChange?: (value: string) => void
    onAgencyMenuScrollToBottom?: () => void
    isLoadingMoreAgencies?: boolean
    onSearchChange: (value: string) => void
    onStatusFilterChange: (status?: FixationStatus) => void
    onColumnVisibilityChange: (
        columnId: FixationColumnId,
        visible: boolean,
    ) => void
}

const FixationsTableTools = ({
    columnVisibility,
    columnOptionsAuthority = [],
    statusFilter,
    showAgencyFilter = false,
    showAgentFilter = false,
    agencyOptions = [],
    agentOptions = [],
    agencyId,
    agentId,
    onAgencyChange,
    onAgentChange,
    onAgencySearchChange,
    onAgencyMenuScrollToBottom,
    isLoadingMoreAgencies = false,
    onSearchChange,
    onStatusFilterChange,
    onColumnVisibilityChange,
}: FixationsTableToolsProps) => {
    const columnOptions =
        getFixationColumnOptionsForAuthority(columnOptionsAuthority)
    const visibleCount = columnOptions.filter(
        (column) => columnVisibility[column.id],
    ).length

    const selectedStatus =
        STATUS_OPTIONS.find((item) => item.value === statusFilter) ?? null

    return (
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="min-w-[260px] flex-1">
                <DebouceInput
                    placeholder="Поиск по фиксациям..."
                    suffix={<TbSearch className="text-lg" />}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onSearchChange(e.target.value)
                    }
                />
            </div>
            {showAgencyFilter ? <div className="w-full shrink-0 lg:w-[19.5rem]">
                <Select<FilterOption, false> isClearable isSearchable placeholder="Все агентства" options={agencyOptions} value={agencyOptions.find((item) => item.value === agencyId) ?? null} onChange={(option) => onAgencyChange?.(option ?? null)} onInputChange={(value, actionMeta) => {
                    if (actionMeta.action === 'input-change') {
                        onAgencySearchChange?.(value)
                    } else if (actionMeta.action === 'menu-close' || actionMeta.action === 'input-blur') {
                        onAgencySearchChange?.('')
                    }
                    return value
                }} filterOption={() => true} onMenuScrollToBottom={onAgencyMenuScrollToBottom} isLoading={isLoadingMoreAgencies} />
            </div> : null}
            {showAgentFilter ? <div className="w-full shrink-0 lg:w-[19.5rem]">
                <Select<FilterOption, false> isClearable isSearchable placeholder="Все агенты" options={agentOptions} value={agentOptions.find((item) => item.value === agentId) ?? null} onChange={(option) => onAgentChange?.(option?.value)} isDisabled={!agencyId && !agentOptions.length} />
            </div> : null}
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
            <div className="flex shrink-0 lg:ml-auto">
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
                {columnOptions.map((column) => {
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
        </div>
    )
}

export default FixationsTableTools
