import { TbAlignLeft } from 'react-icons/tb'
import ToolButton from './ToolButton'
import type { BaseToolButtonProps } from './types'

const ToolButtonAlignLeft = ({ editor }: BaseToolButtonProps) => {
    return (
        <ToolButton
            title="По левому краю"
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
            <TbAlignLeft />
        </ToolButton>
    )
}

export default ToolButtonAlignLeft
