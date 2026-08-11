import { Extension } from '@tiptap/core'

export type BlockSpacingAttrs = {
    marginTop?: string
    marginBottom?: string
    paddingLeft?: string
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        blockSpacing: {
            setBlockSpacing: (attrs: BlockSpacingAttrs) => ReturnType
            unsetBlockSpacing: () => ReturnType
        }
    }
}

const toStyle = (attrs: BlockSpacingAttrs) => {
    const parts: string[] = []
    if (attrs.marginTop) parts.push(`margin-top: ${attrs.marginTop}`)
    if (attrs.marginBottom) parts.push(`margin-bottom: ${attrs.marginBottom}`)
    if (attrs.paddingLeft) parts.push(`padding-left: ${attrs.paddingLeft}`)
    return parts.length ? parts.join('; ') : null
}

const parseStyle = (style: string): BlockSpacingAttrs => {
    const result: BlockSpacingAttrs = {}
    style.split(';').forEach((part) => {
        const [rawKey, rawValue] = part.split(':').map((s) => s.trim())
        if (!rawKey || !rawValue) return
        if (rawKey === 'margin-top') result.marginTop = rawValue
        if (rawKey === 'margin-bottom') result.marginBottom = rawValue
        if (rawKey === 'padding-left') result.paddingLeft = rawValue
    })
    return result
}

const BlockSpacing = Extension.create({
    name: 'blockSpacing',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    spacingStyle: {
                        default: null,
                        parseHTML: (element) => {
                            const marginTop = element.style.marginTop || ''
                            const marginBottom =
                                element.style.marginBottom || ''
                            const paddingLeft = element.style.paddingLeft || ''
                            if (!marginTop && !marginBottom && !paddingLeft) {
                                return null
                            }
                            return toStyle({
                                marginTop,
                                marginBottom,
                                paddingLeft,
                            })
                        },
                        renderHTML: (attributes) => {
                            if (!attributes.spacingStyle) return {}
                            return { style: attributes.spacingStyle }
                        },
                    },
                },
            },
        ]
    },

    addCommands() {
        return {
            setBlockSpacing:
                (attrs) =>
                ({ commands, editor, state }) => {
                    const type = this.options.types.find((name: string) =>
                        editor.isActive(name),
                    )
                    if (!type) return false

                    const { $from } = state.selection
                    const node = $from.node($from.depth)
                    const prev = parseStyle(
                        (node.attrs.spacingStyle as string | null) || '',
                    )
                    const next: BlockSpacingAttrs = { ...prev, ...attrs }
                    // Allow clearing a side by passing empty string
                    ;(
                        Object.keys(attrs) as (keyof BlockSpacingAttrs)[]
                    ).forEach((key) => {
                        if (attrs[key] === '') {
                            delete next[key]
                        }
                    })

                    return commands.updateAttributes(type, {
                        spacingStyle: toStyle(next),
                    })
                },
            unsetBlockSpacing:
                () =>
                ({ commands, editor }) => {
                    const type = this.options.types.find((name: string) =>
                        editor.isActive(name),
                    )
                    if (!type) return false
                    return commands.resetAttributes(type, 'spacingStyle')
                },
        }
    },
})

export default BlockSpacing
