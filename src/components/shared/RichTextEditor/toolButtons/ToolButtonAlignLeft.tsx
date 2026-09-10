import { TbAlignLeft } from 'react-icons/tb'
import ToolButton from './ToolButton'
import type { BaseToolButtonProps } from './types'

const ToolButtonAlignLeft = ({ editor }: BaseToolButtonProps) => {
    const active =
        editor.isActive({ textAlign: 'left' }) ||
        (!editor.isActive({ textAlign: 'center' }) &&
            !editor.isActive({ textAlign: 'right' }) &&
            !editor.isActive({ textAlign: 'justify' }))

    return (
        <ToolButton
            title="По левому краю"
            active={active}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
            <TbAlignLeft />
        </ToolButton>
    )
}

export default ToolButtonAlignLeft
