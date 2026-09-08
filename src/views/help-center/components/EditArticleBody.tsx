import { useEffect, useRef, useState } from 'react'
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
import ToolButtonAlignLeft from '@/components/shared/RichTextEditor/toolButtons/ToolButtonAlignLeft'
import ToolButtonAlignCenter from '@/components/shared/RichTextEditor/toolButtons/ToolButtonAlignCenter'
import ToolButtonAlignRight from '@/components/shared/RichTextEditor/toolButtons/ToolButtonAlignRight'
import ToolButtonImage from '@/components/shared/RichTextEditor/toolButtons/ToolButtonImage'
import ToolButtonDeleteImage from '@/components/shared/RichTextEditor/toolButtons/ToolButtonDeleteImage'
import FontSize from '@/components/shared/RichTextEditor/extensions/FontSize'
import BlockSpacing from '@/components/shared/RichTextEditor/extensions/BlockSpacing'
import CustomImage from '@/components/shared/RichTextEditor/extensions/Image'
import {
    focusEditorAtPointer,
    proseMirrorSurfaceClass,
    shouldManualFocusRichTextEditor,
} from '@/components/shared/RichTextEditor/focusEditorAtPointer'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Spinner from '@/components/ui/Spinner'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiUploadNewsMedia } from '@/services/HelpCenterService'
import { getApiErrorMessage } from '@/services/auth/authUtils'

type EditArticleBodyProps = {
    content?: string
    onChange: (html: string) => void
    fillHeight?: boolean
    newsId?: string | number
    onUploadImage?: (file: File) => Promise<string>
}

const headingColorClass =
    '[&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 dark:[&_h1]:text-gray-100 dark:[&_h2]:text-gray-100 dark:[&_h3]:text-gray-100 dark:[&_h4]:text-gray-100 dark:[&_h5]:text-gray-100 dark:[&_h6]:text-gray-100'

const imageEditorClass =
    '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 [&_img]:block [&_img]:cursor-pointer [&_img]:transition-all [&_img:hover]:ring-2 [&_img:hover]:ring-primary/40 [&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-primary [&_img.ProseMirror-selectednode]:ring-offset-2 dark:[&_img.ProseMirror-selectednode]:ring-offset-gray-900 [&_img.ProseMirror-selectednode]:shadow-lg'

const getEditorTypographyClass = (fillHeight?: boolean) =>
    `m-2 focus:outline-hidden ${
        fillHeight
            ? 'min-h-full h-full cursor-text outline-none'
            : proseMirrorSurfaceClass
    } ${headingColorClass} ${imageEditorClass}`

const editorContentClass =
    `prose max-w-full dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 [&_.ProseMirror]:cursor-text [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_h4]:!text-gray-900 [&_h5]:!text-gray-900 [&_h6]:!text-gray-900 dark:[&_h1]:!text-gray-100 dark:[&_h2]:!text-gray-100 dark:[&_h3]:!text-gray-100 dark:[&_h4]:!text-gray-100 dark:[&_h5]:!text-gray-100 dark:[&_h6]:!text-gray-100 ${imageEditorClass}`

const EditArticleBody = ({
    content,
    onChange,
    fillHeight = false,
    newsId,
    onUploadImage,
}: EditArticleBodyProps) => {
    const [isUploading, setIsUploading] = useState(false)
    const newsIdRef = useRef(newsId)
    newsIdRef.current = newsId
    const onUploadImageRef = useRef(onUploadImage)
    onUploadImageRef.current = onUploadImage

    const handleUploadFiles = async (files: File[], insertPos?: number) => {
        if (!editor || files.length === 0) return

        setIsUploading(true)
        let currentPos = insertPos

        for (const file of files) {
            try {
                let imageUrl = ''
                if (onUploadImageRef.current) {
                    imageUrl = await onUploadImageRef.current(file)
                } else if (newsIdRef.current) {
                    imageUrl = await apiUploadNewsMedia({
                        newsId: newsIdRef.current,
                        file,
                    })
                } else {
                    imageUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.onerror = reject
                        reader.readAsDataURL(file)
                    })
                }

                if (imageUrl) {
                    if (typeof currentPos === 'number') {
                        editor
                            .chain()
                            .focus()
                            .insertContentAt(currentPos, {
                                type: 'image',
                                attrs: { src: imageUrl, alt: file.name },
                            })
                            .run()
                        currentPos += 1
                    } else {
                        editor
                            .chain()
                            .focus()
                            .setImage({ src: imageUrl, alt: file.name })
                            .run()
                    }
                }
            } catch (error) {
                toast.push(
                    <Notification type="danger">
                        {getApiErrorMessage(
                            error,
                            `Не удалось загрузить изображение "${file.name}"`,
                        )}
                    </Notification>,
                    { placement: 'top-end' },
                )
            }
        }
        setIsUploading(false)
    }

    const handleUploadFilesRef = useRef(handleUploadFiles)
    handleUploadFilesRef.current = handleUploadFiles

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
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),
            CustomImage.configure({
                allowBase64: true,
            }),
        ],
        editorProps: {
            attributes: {
                class: getEditorTypographyClass(fillHeight),
            },
            handleDrop: (view, event, _slice, moved) => {
                if (
                    !moved &&
                    event.dataTransfer &&
                    event.dataTransfer.files &&
                    event.dataTransfer.files.length > 0
                ) {
                    const imageFiles = Array.from(
                        event.dataTransfer.files,
                    ).filter((file) => file.type.startsWith('image/'))
                    if (imageFiles.length > 0) {
                        event.preventDefault()
                        event.stopPropagation()
                        const coordinates = view.posAtCoords({
                            left: event.clientX,
                            top: event.clientY,
                        })
                        void handleUploadFilesRef.current(
                            imageFiles,
                            coordinates?.pos,
                        )
                        return true
                    }
                }
                return false
            },
            handlePaste: (_view, event) => {
                if (event.clipboardData) {
                    const imageFiles: File[] = []
                    if (
                        event.clipboardData.files &&
                        event.clipboardData.files.length > 0
                    ) {
                        for (
                            let i = 0;
                            i < event.clipboardData.files.length;
                            i++
                        ) {
                            const file = event.clipboardData.files[i]
                            if (file.type.startsWith('image/')) {
                                imageFiles.push(file)
                            }
                        }
                    } else if (
                        event.clipboardData.items &&
                        event.clipboardData.items.length > 0
                    ) {
                        for (
                            let i = 0;
                            i < event.clipboardData.items.length;
                            i++
                        ) {
                            const item = event.clipboardData.items[i]
                            if (item.type.startsWith('image/')) {
                                const file = item.getAsFile()
                                if (file) {
                                    imageFiles.push(file)
                                }
                            }
                        }
                    }

                    if (imageFiles.length > 0) {
                        event.preventDefault()
                        event.stopPropagation()
                        void handleUploadFilesRef.current(imageFiles)
                        return true
                    }
                }
                return false
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
        <div
            className={
                fillHeight
                    ? 'flex flex-1 flex-col rounded-xl border border-gray-200 dark:border-gray-700'
                    : 'rounded-xl border border-gray-200 dark:border-gray-700'
            }
            onDragOver={(event) => {
                if (event.dataTransfer?.types?.includes('Files')) {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'copy'
                }
            }}
            onDrop={(event) => {
                if (
                    event.dataTransfer &&
                    event.dataTransfer.files &&
                    event.dataTransfer.files.length > 0
                ) {
                    const imageFiles = Array.from(
                        event.dataTransfer.files,
                    ).filter((file) => file.type.startsWith('image/'))
                    if (imageFiles.length > 0) {
                        event.preventDefault()
                        event.stopPropagation()
                        void handleUploadFilesRef.current(imageFiles)
                    }
                }
            }}
        >
            <div className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-2 border-b border-gray-200 p-2 dark:border-gray-700">
                <ToolButtonBold editor={editor} />
                <ToolButtonItalic editor={editor} />
                <ToolButtonStrike editor={editor} />
                <ToolButtonCode editor={editor} />
                <ToolButtonTextColor editor={editor} />
                <ToolButtonBlockquote editor={editor} />
                <ToolButtonHeading editor={editor} />
                <ToolButtonFontSize editor={editor} />
                <ToolButtonSpacing editor={editor} />
                <ToolButtonAlignLeft editor={editor} />
                <ToolButtonAlignCenter editor={editor} />
                <ToolButtonAlignRight editor={editor} />
                <ToolButtonBulletList editor={editor} />
                <ToolButtonOrderedList editor={editor} />
                <ToolButtonCodeBlock editor={editor} />
                <ToolButtonHorizontalRule editor={editor} />
                <ToolButtonImage
                    editor={editor}
                    disabled={isUploading}
                    onSelectImage={(files) =>
                        void handleUploadFilesRef.current(files)
                    }
                />
                <ToolButtonDeleteImage
                    editor={editor}
                    onDelete={() => {
                        editor.chain().focus().deleteSelection().run()
                    }}
                />
                {isUploading ? (
                    <div className="flex items-center gap-2 pl-2 text-xs font-medium text-primary">
                        <Spinner size={16} />
                        <span>Загрузка картинки...</span>
                    </div>
                ) : null}
            </div>
            <div
                className={fillHeight ? 'flex-1 px-2' : 'overflow-auto px-2'}
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
                    className={
                        fillHeight
                            ? `${editorContentClass} h-full [&_.ProseMirror]:min-h-full`
                            : `${editorContentClass} [&_.ProseMirror]:min-h-[320px]`
                    }
                    editor={editor}
                />
            </div>
        </div>
    )
}

export default EditArticleBody
