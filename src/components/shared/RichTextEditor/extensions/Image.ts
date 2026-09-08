import { Node, mergeAttributes } from '@tiptap/core'

export interface ImageOptions {
    inline: boolean
    allowBase64: boolean
    HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        image: {
            setImage: (options: {
                src: string
                alt?: string
                title?: string
                textAlign?: 'left' | 'center' | 'right'
            }) => ReturnType
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

        // Clean out previous conflicting alignment classes if present
        const cleanedExisting = existingClass
            .replace(/\b(mx-auto|ml-auto|mr-auto)\b/g, '')
            .trim()

        const classes = [baseClass, alignClass, cleanedExisting]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()

        const finalAttributes = {
            ...HTMLAttributes,
            class: classes,
        }

        if (align) {
            const extraStyle = getAlignmentStyle(align)
            const existingStyle = (HTMLAttributes.style as string) || ''
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
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: options,
                    })
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
