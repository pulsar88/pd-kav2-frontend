import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbColumns, TbSearch } from 'react-icons/tb'
import type { ChangeEvent } from 'react'
import {
    FIXATION_COLUMN_OPTIONS,
    type FixationColumnId,
    type FixationColumnVisibility,
} from '../columnVisibility'

type FixationsTableToolsProps = {
    columnVisibility: FixationColumnVisibility
    onSearchChange: (value: string) => void
    onColumnVisibilityChange: (
        columnId: FixationColumnId,
        visible: boolean,
    ) => void
}

const FixationsTableTools = ({
    columnVisibility,
    onSearchChange,
    onColumnVisibilityChange,
}: FixationsTableToolsProps) => {
    const visibleCount = FIXATION_COLUMN_OPTIONS.filter(
        (column) => columnVisibility[column.id],
    ).length

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
                <DebouceInput
                    placeholder="Поиск по фиксациям..."
                    suffix={<TbSearch className="text-lg" />}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onSearchChange(e.target.value)
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
