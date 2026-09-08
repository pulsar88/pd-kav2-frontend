import { TbAlignCenter } from 'react-icons/tb'
import ToolButton from './ToolButton'
import type { BaseToolButtonProps } from './types'

const ToolButtonAlignCenter = ({ editor }: BaseToolButtonProps) => {
    return (
        <ToolButton
            title="По центру"
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
            <TbAlignCenter />
        </ToolButton>
    )
}

export default ToolButtonAlignCenter
