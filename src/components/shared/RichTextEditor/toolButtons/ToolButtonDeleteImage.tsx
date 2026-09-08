import { TbTrash } from 'react-icons/tb'
import ToolButton from './ToolButton'
import type { BaseToolButtonProps } from './types'

type ToolButtonDeleteImageProps = BaseToolButtonProps & {
    onDelete?: () => void
    disabled?: boolean
}

const ToolButtonDeleteImage = ({
    editor,
    onDelete,
    disabled = false,
}: ToolButtonDeleteImageProps) => {
    const isImageActive = editor.isActive('image')

    const handleClick = () => {
        if (!isImageActive) return
        if (onDelete) {
            onDelete()
        } else {
            editor.chain().focus().deleteSelection().run()
        }
    }

    if (!isImageActive) {
        return null
    }

    return (
        <ToolButton
            title="Удалить выбранное изображение"
            disabled={disabled}
            className="text-error hover:bg-error/10 hover:text-error"
            onClick={handleClick}
        >
            <TbTrash />
        </ToolButton>
    )
}

export default ToolButtonDeleteImage
