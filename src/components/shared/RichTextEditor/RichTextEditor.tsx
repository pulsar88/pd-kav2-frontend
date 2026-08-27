import { useRef, useState } from 'react'
import classNames from '@/utils/classNames'
import ToolButtonBold from './toolButtons/ToolButtonBold'
import ToolButtonItalic from './toolButtons/ToolButtonItalic'
import ToolButtonStrike from './toolButtons/ToolButtonStrike'
import ToolButtonCode from './toolButtons/ToolButtonCode'
import ToolButtonOrderedList from './toolButtons/ToolButtonOrderedList'
import ToolButtonCodeBlock from './toolButtons/ToolButtonCodeBlock'
import ToolButtonBlockquote from './toolButtons/ToolButtonBlockquote'
import ToolButtonHorizontalRule from './toolButtons/ToolButtonHorizontalRule'
import ToolButtonHeading from './toolButtons/ToolButtonHeading'
import ToolButtonParagraph from './toolButtons/ToolButtonParagraph'
import ToolButtonUndo from './toolButtons/ToolButtonUndo'
import ToolButtonRedo from './toolButtons/ToolButtonRedo'
import ToolButtonBulletList from './toolButtons/ToolButtonBulletList'
import ToolButtonFontSize from './toolButtons/ToolButtonFontSize'
import ToolButtonTextColor from './toolButtons/ToolButtonTextColor'
import ToolButtonSpacing from './toolButtons/ToolButtonSpacing'
import ToolButtonAlignLeft from './toolButtons/ToolButtonAlignLeft'
import ToolButtonAlignCenter from './toolButtons/ToolButtonAlignCenter'
import ToolButtonAlignRight from './toolButtons/ToolButtonAlignRight'
import ToolButtonImage from './toolButtons/ToolButtonImage'
import ToolButtonDeleteImage from './toolButtons/ToolButtonDeleteImage'
import FontSize from './extensions/FontSize'
import BlockSpacing from './extensions/BlockSpacing'
import CustomImage from './extensions/Image'
import {
    focusEditorAtPointer,
    proseMirrorSurfaceClass,
    shouldManualFocusRichTextEditor,
} from './focusEditorAtPointer'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import type { Editor, EditorContentProps, JSONContent } from '@tiptap/react'
import type { ReactNode, JSX, Ref } from 'react'
import type { BaseToolButtonProps, HeadingLevel } from './toolButtons/types'

export type RichTextEditorRef = HTMLDivElement

type RichTextEditorProps = {
    content?: string
    invalid?: boolean
    onUploadImage?: (file: File) => Promise<string>
    onDeleteImage?: (src: string) => Promise<void>
    customToolBar?: (
        editor: Editor,
        components: {
            ToolButtonBold: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonItalic: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonStrike: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonCode: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonBlockquote: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonHeading: ({
                editor,
            }: BaseToolButtonProps & {
                headingLevel?: HeadingLevel[]
            }) => JSX.Element
            ToolButtonBulletList: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonOrderedList: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonCodeBlock: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonHorizontalRule: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonParagraph: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonUndo: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonRedo: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonImage: ({
                editor,
                onSelectImage,
                disabled,
            }: BaseToolButtonProps & {
                onSelectImage?: (files: File[]) => void
                disabled?: boolean
            }) => JSX.Element
            ToolButtonDeleteImage: ({
                editor,
                onDelete,
                disabled,
            }: BaseToolButtonProps & {
                onDelete?: () => void
                disabled?: boolean
            }) => JSX.Element | null
        },
    ) => ReactNode
    onChange?: (content: {
        text: string
        html: string
        json: JSONContent
    }) => void
    editorContentClass?: string
    customEditor?: Editor | null
    ref?: Ref<RichTextEditorRef>
} & Omit<EditorContentProps, 'editor' | 'ref' | 'onChange'>

const imageEditorClass =
    '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 [&_img]:block [&_img]:cursor-pointer [&_img]:transition-all [&_img:hover]:ring-2 [&_img:hover]:ring-primary/40 [&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-primary [&_img.ProseMirror-selectednode]:ring-offset-2 dark:[&_img.ProseMirror-selectednode]:ring-offset-gray-900 [&_img.ProseMirror-selectednode]:shadow-lg'

const RichTextEditor = (props: RichTextEditorProps) => {
    const {
        content = '',
        customToolBar,
        invalid,
        onUploadImage,
        onDeleteImage,
        onChange,
        editorContentClass,
        customEditor,
        ref,
        ...rest
    } = props

    const [isUploading, setIsUploading] = useState(false)
    const onUploadImageRef = useRef(onUploadImage)
    onUploadImageRef.current = onUploadImage
    const onDeleteImageRef = useRef(onDeleteImage)
    onDeleteImageRef.current = onDeleteImage

    const handleDeleteImage = async (src: string) => {
        if (!src) return
        try {
            if (onDeleteImageRef.current) {
                await onDeleteImageRef.current(src)
            }
        } catch (err) {
            console.error('Failed to delete image:', err)
        }
    }

    const handleDeleteImageRef = useRef(handleDeleteImage)
    handleDeleteImageRef.current = handleDeleteImage

    const handleUploadFiles = async (files: File[], insertPos?: number) => {
        if (!editor || files.length === 0) return

        setIsUploading(true)
        let currentPos = insertPos

        for (const file of files) {
            try {
                let imageUrl = ''
                if (onUploadImageRef.current) {
                    imageUrl = await onUploadImageRef.current(file)
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
            } catch (err) {
                console.error('Error inserting image:', err)
            }
        }
        setIsUploading(false)
    }

    const handleUploadFilesRef = useRef(handleUploadFiles)
    handleUploadFilesRef.current = handleUploadFiles

    const editor = customEditor
        ? customEditor
        : useEditor({
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
                      class: `m-2 focus:outline-hidden ${proseMirrorSurfaceClass} [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 dark:[&_h1]:text-gray-100 dark:[&_h2]:text-gray-100 dark:[&_h3]:text-gray-100 dark:[&_h4]:text-gray-100 dark:[&_h5]:text-gray-100 dark:[&_h6]:text-gray-100 ${imageEditorClass}`,
                  },
                  handleKeyDown: (view, event) => {
                      if (event.key === 'Backspace' || event.key === 'Delete') {
                          const { selection } = view.state
                          const node = (selection as { node?: { type: { name: string }; attrs: { src: string } } })?.node
                          if (node?.type?.name === 'image' && node.attrs?.src) {
                              void handleDeleteImageRef.current(node.attrs.src)
                          }
                      }
                      return false
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
              content,
              onUpdate({ editor }) {
                  onChange?.({
                      text: editor.getText(),
                      html: editor.getHTML(),
                      json: editor.getJSON(),
                  })
              },
          })

    if (!editor) return null

    return (
        <div
            className={classNames(
                'rich-text-editor rounded-xl ring-1 ring-gray-200 dark:ring-gray-600 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 pt-3',
                editor.isFocused && 'ring-primary border-primary',
                invalid && 'bg-error-subtle',
                editor.isFocused &&
                    invalid &&
                    'bg-error-subtle ring-error border-error',
            )}
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
            <div className="flex flex-wrap gap-x-1 gap-y-2 px-2">
                {customToolBar ? (
                    customToolBar(editor, {
                        ToolButtonBold,
                        ToolButtonItalic,
                        ToolButtonStrike,
                        ToolButtonCode,
                        ToolButtonBlockquote,
                        ToolButtonHeading,
                        ToolButtonBulletList,
                        ToolButtonOrderedList,
                        ToolButtonCodeBlock,
                        ToolButtonHorizontalRule,
                        ToolButtonParagraph,
                        ToolButtonUndo,
                        ToolButtonRedo,
                        ToolButtonImage,
                        ToolButtonDeleteImage,
                    })
                ) : (
                    <>
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
                                const src = editor.getAttributes('image')?.src
                                if (src) {
                                    void handleDeleteImage(src)
                                }
                                editor.chain().focus().deleteSelection().run()
                            }}
                        />
                    </>
                )}
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
                    ref={ref}
                    className={classNames(
                        'max-h-[600px] prose prose-p:text-sm dark:prose-invert dark:prose-p:text-gray-400 max-w-full prose-headings:text-gray-900 dark:prose-headings:text-gray-100 [&_.ProseMirror]:min-h-[320px] [&_.ProseMirror]:cursor-text [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_h4]:!text-gray-900 [&_h5]:!text-gray-900 [&_h6]:!text-gray-900 dark:[&_h1]:!text-gray-100 dark:[&_h2]:!text-gray-100 dark:[&_h3]:!text-gray-100 dark:[&_h4]:!text-gray-100 dark:[&_h5]:!text-gray-100 dark:[&_h6]:!text-gray-100',
                        imageEditorClass,
                        editorContentClass,
                    )}
                    editor={editor}
                    {...rest}
                />
            </div>
        </div>
    )
}

export default RichTextEditor
