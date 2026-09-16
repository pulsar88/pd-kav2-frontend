import { TbIndentDecrease } from 'react-icons/tb'
import ToolButton from './ToolButton'
import type { BaseToolButtonProps } from './types'

const ToolButtonLiftList = ({ editor }: BaseToolButtonProps) => {
    const canLift = editor.can().liftListItem('listItem')

    return (
        <ToolButton
            title="Поднять пункт списка (Shift+Tab)"
            disabled={!canLift}
            onClick={() =>
                editor.chain().focus().liftListItem('listItem').run()
            }
        >
            <TbIndentDecrease />
        </ToolButton>
    )
}

export default ToolButtonLiftList
