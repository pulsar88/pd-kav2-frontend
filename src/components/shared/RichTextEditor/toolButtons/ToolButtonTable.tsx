import {
    TbColumnInsertLeft,
    TbColumnInsertRight,
    TbColumnRemove,
    TbLayoutColumns,
    TbLayoutRows,
    TbRowInsertBottom,
    TbRowInsertTop,
    TbRowRemove,
    TbSquare,
    TbTable,
    TbTrash,
} from 'react-icons/tb'
import ToolButton from './ToolButton'
import Dropdown from '@/components/ui/Dropdown'
import type { BaseToolButtonProps } from './types'

const ToolButtonTable = ({ editor }: BaseToolButtonProps) => {
    const inTable = editor.isActive('table')

    return (
        <Dropdown
            renderTitle={
                <ToolButton title="Таблица" active={inTable}>
                    <TbTable />
                </ToolButton>
            }
        >
            <Dropdown.Item
                eventKey="insert-table"
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run()
                }
            >
                <span className="flex items-center gap-2">
                    <TbTable className="text-lg" />
                    Вставить таблицу 3×3
                </span>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            <Dropdown.Item
                eventKey="toggle-header-row"
                disabled={!inTable}
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            >
                <span className="flex items-center gap-2">
                    <TbLayoutRows className="text-lg" />
                    Строка как шапка
                </span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="toggle-header-col"
                disabled={!inTable}
                onClick={() =>
                    editor.chain().focus().toggleHeaderColumn().run()
                }
            >
                <span className="flex items-center gap-2">
                    <TbLayoutColumns className="text-lg" />
                    Столбец как шапка
                </span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="toggle-header-cell"
                disabled={!inTable}
                onClick={() => editor.chain().focus().toggleHeaderCell().run()}
            >
                <span className="flex items-center gap-2">
                    <TbSquare className="text-lg" />
                    Ячейка как шапка
                </span>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            <Dropdown.Item
                eventKey="add-row-before"
                disabled={!inTable}
                onClick={() => editor.chain().focus().addRowBefore().run()}
            >
                <span className="flex items-center gap-2">
                    <TbRowInsertTop className="text-lg" />
                    Строка выше
                </span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="add-row-after"
                disabled={!inTable}
                onClick={() => editor.chain().focus().addRowAfter().run()}
            >
                <span className="flex items-center gap-2">
                    <TbRowInsertBottom className="text-lg" />
                    Строка ниже
                </span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="add-col-before"
                disabled={!inTable}
                onClick={() => editor.chain().focus().addColumnBefore().run()}
            >
                <span className="flex items-center gap-2">
                    <TbColumnInsertLeft className="text-lg" />
                    Столбец слева
                </span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="add-col-after"
                disabled={!inTable}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
                <span className="flex items-center gap-2">
                    <TbColumnInsertRight className="text-lg" />
                    Столбец справа
                </span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="delete-row"
                disabled={!inTable}
                onClick={() => editor.chain().focus().deleteRow().run()}
            >
                <span className="flex items-center gap-2">
                    <TbRowRemove className="text-lg" />
                    Удалить строку
                </span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="delete-col"
                disabled={!inTable}
                onClick={() => editor.chain().focus().deleteColumn().run()}
            >
                <span className="flex items-center gap-2">
                    <TbColumnRemove className="text-lg" />
                    Удалить столбец
                </span>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            <Dropdown.Item
                eventKey="delete-table"
                disabled={!inTable}
                onClick={() => editor.chain().focus().deleteTable().run()}
            >
                <span className="flex items-center gap-2 text-error">
                    <TbTrash className="text-lg" />
                    Удалить таблицу
                </span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default ToolButtonTable
