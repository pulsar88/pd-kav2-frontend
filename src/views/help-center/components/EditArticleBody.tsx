import { useEffect } from 'react'
import ToolButtonBold from '@/components/shared/RichTextEditor/toolButtons/ToolButtonBold'
import ToolButtonItalic from '@/components/shared/RichTextEditor/toolButtons/ToolButtonItalic'
import ToolButtonStrike from '@/components/shared/RichTextEditor/toolButtons/ToolButtonStrike'
import ToolButtonCode from '@/components/shared/RichTextEditor/toolButtons/ToolButtonCode'
import ToolButtonOrderedList from '@/components/shared/RichTextEditor/toolButtons/ToolButtonOrderedList'
import ToolButtonCodeBlock from '@/components/shared/RichTextEditor/toolButtons/ToolButtonCodeBlock'
import ToolButtonBlockquote from '@/components/shared/RichTextEditor/toolButtons/ToolButtonBlockquote'
import ToolButtonHorizontalRule from '@/components/shared/RichTextEditor/toolButtons/ToolButtonHorizontalRule'
import ToolButtonHeading from '@/components/shared/RichTextEditor/toolButtons/ToolButtonHeading'
import ToolButtonBulletList from '@/components/shared/RichTextEditor/toolButtons/ToolButtonBulletList'
import ToolButtonFontSize from '@/components/shared/RichTextEditor/toolButtons/ToolButtonFontSize'
import ToolButtonTextColor from '@/components/shared/RichTextEditor/toolButtons/ToolButtonTextColor'
import ToolButtonSpacing from '@/components/shared/RichTextEditor/toolButtons/ToolButtonSpacing'
import FontSize from '@/components/shared/RichTextEditor/extensions/FontSize'
import BlockSpacing from '@/components/shared/RichTextEditor/extensions/BlockSpacing'
import {
    focusEditorAtPointer,
    proseMirrorSurfaceClass,
    shouldManualFocusRichTextEditor,
} from '@/components/shared/RichTextEditor/focusEditorAtPointer'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

type EditArticleBodyProps = {
    content?: string
    onChange: (html: string) => void
}

const editorTypographyClass =
    `m-2 focus:outline-hidden ${proseMirrorSurfaceClass} [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 dark:[&_h1]:text-gray-100 dark:[&_h2]:text-gray-100 dark:[&_h3]:text-gray-100 dark:[&_h4]:text-gray-100 dark:[&_h5]:text-gray-100 dark:[&_h6]:text-gray-100`

const EditArticleBody = ({ content, onChange }: EditArticleBodyProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                },
                orderedList: {
                    keepMarks: true,
                },
            }),
            TextStyle,
            Color,
            FontSize,
            BlockSpacing,
        ],
        editorProps: {
            attributes: {
                class: editorTypographyClass,
            },
        },
        content: content || '',
        onUpdate: ({ editor: currentEditor }) => {
            onChange(currentEditor.getHTML())
        },
    })

    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            editor.commands.setContent(content)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content])

    if (!editor) return null

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-x-1 gap-y-2 border-b border-gray-200 p-2 dark:border-gray-700">
                <ToolButtonBold editor={editor} />
                <ToolButtonItalic editor={editor} />
                <ToolButtonStrike editor={editor} />
                <ToolButtonCode editor={editor} />
                <ToolButtonTextColor editor={editor} />
                <ToolButtonBlockquote editor={editor} />
                <ToolButtonHeading editor={editor} />
                <ToolButtonFontSize editor={editor} />
                <ToolButtonSpacing editor={editor} />
                <ToolButtonBulletList editor={editor} />
                <ToolButtonOrderedList editor={editor} />
                <ToolButtonCodeBlock editor={editor} />
                <ToolButtonHorizontalRule editor={editor} />
            </div>
            <div
                className="overflow-auto px-2"
                onMouseDown={(event) => {
                    if (event.button !== 0) return
                    if (!shouldManualFocusRichTextEditor(editor, event.target)) {
                        return
                    }

                    event.preventDefault()
                    focusEditorAtPointer(editor, event)
                }}
            >
                <EditorContent
                    className="prose max-w-full dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 [&_.ProseMirror]:min-h-[320px] [&_.ProseMirror]:cursor-text [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_h4]:!text-gray-900 [&_h5]:!text-gray-900 [&_h6]:!text-gray-900 dark:[&_h1]:!text-gray-100 dark:[&_h2]:!text-gray-100 dark:[&_h3]:!text-gray-100 dark:[&_h4]:!text-gray-100 dark:[&_h5]:!text-gray-100 dark:[&_h6]:!text-gray-100"
                    editor={editor}
                />
            </div>
        </div>
    )
}

export default EditArticleBody
