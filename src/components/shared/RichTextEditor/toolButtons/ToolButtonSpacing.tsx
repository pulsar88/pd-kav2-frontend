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

const ToolButtonSpacing = ({ editor }: BaseToolButtonProps) => {
    return (
        <Dropdown
            renderTitle={
                <ToolButton title="Отступы">
                    <TbSpacingVertical />
                </ToolButton>
            }
        >
            {presets.map((preset) => (
                <Dropdown.Item
                    key={preset.label}
                    eventKey={`spacing-${preset.label}`}
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
