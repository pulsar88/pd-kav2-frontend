import { TbSpacingVertical } from 'react-icons/tb'
import ToolButton from './ToolButton'
import Dropdown from '@/components/ui/Dropdown'
import type { BaseToolButtonProps } from './types'
import type { BlockSpacingAttrs } from '../extensions/BlockSpacing'

const presets: { label: string; value: BlockSpacingAttrs | null }[] = [
    { label: 'По умолчанию', value: null },
    {
        label: 'Маленький',
        value: { marginTop: '0.5rem', marginBottom: '0.5rem' },
    },
    {
        label: 'Средний',
        value: { marginTop: '1rem', marginBottom: '1rem' },
    },
    {
        label: 'Большой',
        value: { marginTop: '2rem', marginBottom: '2rem' },
    },
]

const normalizeSpacing = (value: string | null | undefined) =>
    (value || '')
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .sort()
        .join('; ')

const spacingToStyle = (attrs: BlockSpacingAttrs | null) => {
    if (!attrs) return ''
    const parts: string[] = []
    if (attrs.marginTop) parts.push(`margin-top: ${attrs.marginTop}`)
    if (attrs.marginBottom) parts.push(`margin-bottom: ${attrs.marginBottom}`)
    if (attrs.paddingLeft) parts.push(`padding-left: ${attrs.paddingLeft}`)
    return normalizeSpacing(parts.join('; '))
}

const ToolButtonSpacing = ({ editor }: BaseToolButtonProps) => {
    const currentSpacing = normalizeSpacing(
        (editor.getAttributes('paragraph').spacingStyle as string | undefined) ||
            (editor.getAttributes('heading').spacingStyle as
                | string
                | undefined) ||
            '',
    )
    const activePreset =
        presets.find(
            (preset) => spacingToStyle(preset.value) === currentSpacing,
        ) || null
    const hasCustomSpacing = Boolean(currentSpacing)

    return (
        <Dropdown
            renderTitle={
                <ToolButton
                    title={
                        activePreset && activePreset.value
                            ? `Отступы: ${activePreset.label}`
                            : 'Отступы'
                    }
                    active={hasCustomSpacing}
                >
                    <TbSpacingVertical />
                </ToolButton>
            }
        >
            {presets.map((preset) => (
                <Dropdown.Item
                    key={preset.label}
                    eventKey={`spacing-${preset.label}`}
                    active={
                        preset.value === null
                            ? !hasCustomSpacing
                            : spacingToStyle(preset.value) === currentSpacing
                    }
                    onClick={() => {
                        if (!preset.value) {
                            editor.chain().focus().unsetBlockSpacing().run()
                            return
                        }
                        editor
                            .chain()
                            .focus()
                            .setBlockSpacing(preset.value)
                            .run()
                    }}
                >
                    {preset.label}
                </Dropdown.Item>
            ))}
        </Dropdown>
    )
}

export default ToolButtonSpacing
