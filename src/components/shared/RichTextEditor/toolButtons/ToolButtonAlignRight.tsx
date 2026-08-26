import { TbAlignRight } from 'react-icons/tb'
import ToolButton from './ToolButton'
import type { BaseToolButtonProps } from './types'

const ToolButtonAlignRight = ({ editor }: BaseToolButtonProps) => {
    return (
        <ToolButton
            title="По правому краю"
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
            <TbAlignRight />
        </ToolButton>
    )
}

export default ToolButtonAlignRight
