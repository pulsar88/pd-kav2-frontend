import { useRef, type ChangeEvent } from 'react'
import { TbPhoto } from 'react-icons/tb'
import ToolButton from './ToolButton'
import type { BaseToolButtonProps } from './types'

type ToolButtonImageProps = BaseToolButtonProps & {
    onSelectImage?: (files: File[]) => void
    disabled?: boolean
}

const ToolButtonImage = ({
    onSelectImage,
    disabled = false,
}: ToolButtonImageProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0 && onSelectImage) {
            onSelectImage(Array.from(files))
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />
            <ToolButton
                title="Вставить изображение"
                disabled={disabled}
                onClick={handleClick}
            >
                <TbPhoto />
            </ToolButton>
        </>
    )
}

export default ToolButtonImage
