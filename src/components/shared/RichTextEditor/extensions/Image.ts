import { Node, mergeAttributes } from '@tiptap/core'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'

export interface ImageOptions {
    inline: boolean
    allowBase64: boolean
    HTMLAttributes: Record<string, unknown>
}

type ImageAttrs = {
    src: string
    alt?: string
    title?: string
    textAlign?: 'left' | 'center' | 'right'
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        image: {
            setImage: (options: ImageAttrs) => ReturnType
            insertImageAt: (pos: number, options: ImageAttrs) => ReturnType
            setImageAlignment: (
                alignment: 'left' | 'center' | 'right',
            ) => ReturnType
        }
    }
}

const getAlignmentClass = (alignment?: string | null) => {
    switch (alignment) {
        case 'center':
            return 'mx-auto'
        case 'right':
            return 'ml-auto'
        case 'left':
            return 'mr-auto'
        default:
            return ''
    }
}

const getAlignmentStyle = (alignment?: string | null) => {
    switch (alignment) {
        case 'center':
            return 'display: block; margin-left: auto; margin-right: auto;'
        case 'right':
            return 'display: block; margin-left: auto; margin-right: 0;'
        case 'left':
            return 'display: block; margin-left: 0; margin-right: auto;'
        default:
            return 'display: block;'
    }
}

const resolveInsertPos = (state: EditorState, pos?: number) => {
    if (typeof pos === 'number') {
        const $pos = state.doc.resolve(Math.min(pos, state.doc.content.size))
        if ($pos.parent.isTextblock) {
            return $pos.after()
        }
        return $pos.pos
    }

    const { selection } = state
    if (selection instanceof NodeSelection) {
        return selection.to
    }

    const { $from } = selection
    if ($from.parent.isTextblock) {
        return $from.after()
    }

    return selection.to
}

const insertImageTransaction = (
    state: EditorState,
    options: ImageAttrs,
    pos?: number,
): Transaction | null => {
    const imageType = state.schema.nodes.image
    const paragraphType = state.schema.nodes.paragraph
    if (!imageType || !paragraphType) {
        return null
    }

    const imageNode = imageType.create({
        src: options.src,
        alt: options.alt ?? null,
        title: options.title ?? null,
        textAlign: options.textAlign ?? null,
    })
    const paragraph = paragraphType.create()

    const insertPos = resolveInsertPos(state, pos)
    const clampedPos = Math.min(Math.max(insertPos, 0), state.doc.content.size)
    const $insert = state.doc.resolve(clampedPos)
    const index = $insert.index()

    // Parent must allow an image at this slot (listItem, doc, blockquote, …).
    if (!$insert.parent.canReplaceWith(index, index, imageType)) {
        return null
    }

    let tr = state.tr.insert(clampedPos, imageNode)
    const posAfterImage = clampedPos + imageNode.nodeSize
    const $after = tr.doc.resolve(posAfterImage)
    if ($after.parent.canReplaceWith($after.index(), $after.index(), paragraphType)) {
        tr = tr.insert(posAfterImage, paragraph)
        tr = tr.setSelection(
            TextSelection.near(tr.doc.resolve(posAfterImage + 1)),
        )
    } else {
        tr = tr.setSelection(TextSelection.near(tr.doc.resolve(posAfterImage)))
    }
    return tr.scrollIntoView()
}

const CustomImage = Node.create<ImageOptions>({
    name: 'image',

    addOptions() {
        return {
            inline: false,
            allowBase64: true,
            HTMLAttributes: {},
        }
    },

    inline() {
        return this.options.inline
    },

    group() {
        return this.options.inline ? 'inline' : 'block'
    },

    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
            textAlign: {
                default: null,
                parseHTML: (element) => {
                    const styleAlign = element.style.textAlign
                    if (
                        styleAlign &&
                        ['left', 'center', 'right'].includes(styleAlign)
                    ) {
                        return styleAlign
                    }
                    if (
                        element.classList.contains('mx-auto') ||
                        (element.style.marginLeft === 'auto' &&
                            element.style.marginRight === 'auto')
                    ) {
                        return 'center'
                    }
                    if (
                        element.classList.contains('ml-auto') ||
                        element.style.marginLeft === 'auto'
                    ) {
                        return 'right'
                    }
                    if (
                        element.classList.contains('mr-auto') ||
                        element.style.marginRight === 'auto'
                    ) {
                        return 'left'
                    }
                    const alignAttr = element.getAttribute('align')
                    if (
                        alignAttr &&
                        ['left', 'center', 'right'].includes(alignAttr)
                    ) {
                        return alignAttr
                    }
                    return null
                },
                renderHTML: (attributes) => {
                    if (!attributes.textAlign) {
                        return {}
                    }
                    return {
                        'data-text-align': attributes.textAlign,
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'img[src]',
            },
        ]
    },

    renderHTML({ HTMLAttributes, node }) {
        const align =
            node?.attrs?.textAlign ||
            HTMLAttributes.textAlign ||
            HTMLAttributes['data-text-align']
        const alignClass = getAlignmentClass(align)

        const baseClass = 'rounded-xl max-w-full h-auto my-4 block shadow-xs'
        const existingClass = (HTMLAttributes.class as string) || ''

        const cleanedExisting = existingClass
            .replace(/\b(mx-auto|ml-auto|mr-auto)\b/g, '')
            .trim()

        const classes = [baseClass, alignClass, cleanedExisting]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()

        const finalAttributes: Record<string, unknown> = {
            ...HTMLAttributes,
            class: classes,
        }

        if (align) {
            const extraStyle = getAlignmentStyle(align)
            const existingStyle =
                typeof HTMLAttributes.style === 'string'
                    ? HTMLAttributes.style
                    : ''
            finalAttributes.style = existingStyle
                ? `${existingStyle.replace(/;\s*$/, '')}; ${extraStyle}`
                : extraStyle
        }

        return [
            'img',
            mergeAttributes(this.options.HTMLAttributes, finalAttributes),
        ]
    },

    addCommands() {
        return {
            setImage:
                (options) =>
                ({ state, dispatch, commands }) => {
                    const tr = insertImageTransaction(state, options)
                    if (!tr) {
                        return commands.insertContent({
                            type: this.name,
                            attrs: options,
                        })
                    }
                    if (dispatch) {
                        dispatch(tr)
                    }
                    return true
                },
            insertImageAt:
                (pos, options) =>
                ({ state, dispatch, commands }) => {
                    const tr = insertImageTransaction(state, options, pos)
                    if (!tr) {
                        return commands.insertContentAt(pos, {
                            type: this.name,
                            attrs: options,
                        })
                    }
                    if (dispatch) {
                        dispatch(tr)
                    }
                    return true
                },
            setImageAlignment:
                (alignment) =>
                ({ commands }) => {
                    return commands.updateAttributes(this.name, {
                        textAlign: alignment,
                    })
                },
        }
    },
})

export default CustomImage
