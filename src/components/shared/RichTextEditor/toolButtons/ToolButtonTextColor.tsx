import { LuPalette } from 'react-icons/lu'
import ToolButton from './ToolButton'
import Dropdown from '@/components/ui/Dropdown'
import type { BaseToolButtonProps } from './types'

const colors = [
    { label: 'По умолчанию', value: '' },
    { label: 'Чёрный', value: '#111827' },
    { label: 'Серый', value: '#6B7280' },
    { label: 'Красный', value: '#EF4444' },
    { label: 'Оранжевый', value: '#F97316' },
    { label: 'Зелёный', value: '#22C55E' },
    { label: 'Синий', value: '#3B82F6' },
    { label: 'Фиолетовый', value: '#8B5CF6' },
    { label: 'Белый', value: '#F9FAFB' },
]

const ToolButtonTextColor = ({ editor }: BaseToolButtonProps) => {
    const current =
        (editor.getAttributes('textStyle').color as string | undefined) || ''

    return (
        <Dropdown
            renderTitle={
                <ToolButton title="Цвет текста">
                    <span className="relative inline-flex flex-col items-center">
                        <LuPalette />
                        <span
                            className="mt-0.5 h-0.5 w-3.5 rounded-full"
                            style={{
                                backgroundColor: current || 'currentColor',
                            }}
                        />
                    </span>
                </ToolButton>
            }
        >
            {colors.map((color) => (
                <Dropdown.Item
                    key={color.label}
                    eventKey={`color-${color.label}`}
                    active={
                        (!current && !color.value) || current === color.value
                    }
                    onClick={() => {
                        if (!color.value) {
                            editor.chain().focus().unsetColor().run()
                            return
                        }
                        editor.chain().focus().setColor(color.value).run()
                    }}
                >
                    <span className="flex items-center gap-2">
                        <span
                            className="inline-block h-3.5 w-3.5 rounded-full border border-gray-300 dark:border-gray-600"
                            style={{
                                backgroundColor: color.value || 'transparent',
                            }}
                        />
                        {color.label}
                    </span>
                </Dropdown.Item>
            ))}
        </Dropdown>
    )
}

export default ToolButtonTextColor
