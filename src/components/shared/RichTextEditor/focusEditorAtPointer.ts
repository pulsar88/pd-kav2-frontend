import type { Editor } from '@tiptap/react'

export const focusEditorAtPointer = (
    editor: Editor,
    event: Pick<MouseEvent, 'clientX' | 'clientY'>,
) => {
    const { view } = editor
    const coords = view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
    })

    if (coords) {
        editor.chain().focus().setTextSelection(coords.pos).run()
        return
    }

    editor.chain().focus('end').run()
}

export const shouldManualFocusRichTextEditor = (
    editor: Editor,
    target: EventTarget | null,
) => {
    if (!(target instanceof Node)) {
        return true
    }

    const proseMirror = editor.view.dom
    if (!proseMirror.contains(target)) {
        return true
    }

    if (target === proseMirror) {
        return true
    }

    if (target instanceof Element && target.classList.contains('ProseMirror')) {
        return true
    }

    return false
}

export const proseMirrorSurfaceClass =
    'min-h-[320px] cursor-text outline-none'
