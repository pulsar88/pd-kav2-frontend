import { TbIndentIncrease } from 'react-icons/tb'
import ToolButton from './ToolButton'
import type { BaseToolButtonProps } from './types'

const ToolButtonSinkList = ({ editor }: BaseToolButtonProps) => {
    const canSink = editor.can().sinkListItem('listItem')

    return (
        <ToolButton
            title="Вложить пункт списка (Tab)"
            disabled={!canSink}
            onClick={() =>
                editor.chain().focus().sinkListItem('listItem').run()
            }
        >
            <TbIndentIncrease />
        </ToolButton>
    )
}

export default ToolButtonSinkList
