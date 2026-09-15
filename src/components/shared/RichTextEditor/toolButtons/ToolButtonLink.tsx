import { useEffect, useState } from 'react'
import { TbLink, TbUnlink } from 'react-icons/tb'
import ToolButton from './ToolButton'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { BaseToolButtonProps } from './types'

const normalizeUrl = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(trimmed)) {
        return trimmed
    }
    return `https://${trimmed}`
}

const ToolButtonLink = ({ editor }: BaseToolButtonProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [url, setUrl] = useState('')
    const isActive = editor.isActive('link')

    useEffect(() => {
        if (!isOpen) return
        const current = editor.getAttributes('link').href as string | undefined
        setUrl(current || '')
    }, [editor, isOpen])

    const close = () => {
        setIsOpen(false)
        editor.chain().focus().run()
    }

    const applyLink = () => {
        const href = normalizeUrl(url)
        if (!href) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            close()
            return
        }

        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href, target: '_blank' })
            .run()
        close()
    }

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        close()
    }

    return (
        <>
            <ToolButton
                title="Ссылка"
                active={isActive}
                onClick={() => setIsOpen(true)}
            >
                <TbLink />
            </ToolButton>
            <Dialog
                isOpen={isOpen}
                width={420}
                onClose={close}
                onRequestClose={close}
            >
                <h5 className="mb-1">Ссылка</h5>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    Укажите URL. Можно вставить адрес без https://
                </p>
                <Input
                    autoFocus
                    value={url}
                    placeholder="https://example.com"
                    onChange={(event) => setUrl(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            applyLink()
                        }
                    }}
                />
                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                    {isActive ? (
                        <Button
                            className="mr-auto"
                            variant="plain"
                            icon={<TbUnlink />}
                            onClick={removeLink}
                        >
                            Убрать
                        </Button>
                    ) : null}
                    <Button variant="plain" onClick={close}>
                        Отмена
                    </Button>
                    <Button variant="solid" onClick={applyLink}>
                        Применить
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default ToolButtonLink
