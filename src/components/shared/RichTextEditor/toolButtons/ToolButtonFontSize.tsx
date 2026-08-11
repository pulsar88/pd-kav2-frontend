import { LuALargeSmall } from 'react-icons/lu'
import ToolButton from './ToolButton'
import Dropdown from '@/components/ui/Dropdown'
import type { BaseToolButtonProps } from './types'

const fontSizes = [
    { label: 'Маленький', value: '12px' },
    { label: 'Обычный', value: '14px' },
    { label: 'Средний', value: '16px' },
    { label: 'Большой', value: '18px' },
    { label: 'Очень большой', value: '24px' },
]

const ToolButtonFontSize = ({ editor }: BaseToolButtonProps) => {
    const currentSize =
        (editor.getAttributes('textStyle').fontSize as string | undefined) || ''

    return (
        <Dropdown
            renderTitle={
                <ToolButton title="Размер шрифта">
                    <LuALargeSmall />
                </ToolButton>
            }
        >
            <Dropdown.Item
                eventKey="font-default"
                active={!currentSize}
                onClick={() =>
                    editor.chain().focus().unsetFontSize().run()
                }
            >
                По умолчанию
            </Dropdown.Item>
            {fontSizes.map((size) => (
                <Dropdown.Item
                    key={size.value}
                    eventKey={`font-${size.value}`}
                    active={currentSize === size.value}
                    onClick={() =>
                        editor.chain().focus().setFontSize(size.value).run()
                    }
                >
                    <span style={{ fontSize: size.value }}>{size.label}</span>
                </Dropdown.Item>
            ))}
        </Dropdown>
    )
}

export default ToolButtonFontSize
