import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import { findParentNodeClosestToPos } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/core'

const isTableNodeSelection = (editor: Editor) => {
    const { selection } = editor.state
    return (
        selection instanceof NodeSelection &&
        selection.node.type.name === 'table'
    )
}

const deleteTableIfSelectedOrEmpty = ({
    editor,
    preferStartOfTable = false,
}: {
    editor: Editor
    preferStartOfTable?: boolean
}) => {
    if (isTableNodeSelection(editor)) {
        return editor.commands.deleteSelection()
    }

    const { selection } = editor.state

    if (preferStartOfTable && selection.empty) {
        const { $from } = selection
        if ($from.parentOffset === 0) {
            const table = findParentNodeClosestToPos(
                $from,
                (node) => node.type.name === 'table',
            )

            if (table && !table.node.textContent.trim()) {
                return editor.commands.deleteTable()
            }

            // Cursor right after a table (start of following block)
            const depth = $from.depth
            if (depth >= 1) {
                const index = $from.index(depth - 1)
                if (index > 0) {
                    const prevNode = $from.node(depth - 1).child(index - 1)
                    if (prevNode.type.name === 'table') {
                        const from =
                            $from.before(depth) - prevNode.nodeSize
                        const to = $from.before(depth)
                        return editor
                            .chain()
                            .focus()
                            .deleteRange({ from, to })
                            .run()
                    }
                }
            }
        }
    }

    return false
}

const CustomTable = Table.extend({
    addKeyboardShortcuts() {
        const parent = this.parent?.() ?? {}

        const handleBackspace = () => {
            if (
                deleteTableIfSelectedOrEmpty({
                    editor: this.editor,
                    preferStartOfTable: true,
                })
            ) {
                return true
            }

            const parentHandler = parent.Backspace
            if (typeof parentHandler === 'function') {
                return Boolean(parentHandler({ editor: this.editor }))
            }

            return false
        }

        const handleDelete = () => {
            if (
                deleteTableIfSelectedOrEmpty({
                    editor: this.editor,
                })
            ) {
                return true
            }

            const parentHandler = parent.Delete
            if (typeof parentHandler === 'function') {
                return Boolean(parentHandler({ editor: this.editor }))
            }

            return false
        }

        return {
            ...parent,
            Backspace: handleBackspace,
            'Mod-Backspace': handleBackspace,
            Delete: handleDelete,
            'Mod-Delete': handleDelete,
        }
    },
})

export const tableExtensions = [
    CustomTable.configure({
        resizable: true,
        allowTableNodeSelection: true,
        HTMLAttributes: {
            class: 'rich-text-table',
        },
    }),
    TableRow,
    TableHeader.configure({
        HTMLAttributes: {
            class: 'rich-text-table-header',
        },
    }),
    TableCell.configure({
        HTMLAttributes: {
            class: 'rich-text-table-cell',
        },
    }),
]
