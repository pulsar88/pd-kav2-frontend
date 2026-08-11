import Dialog from '@/components/ui/Dialog'

type LayoutPreviewDialogProps = {
    isOpen: boolean
    imageSrc?: string
    title: string
    onClose: () => void
}

const LayoutPreviewDialog = ({
    isOpen,
    imageSrc,
    title,
    onClose,
}: LayoutPreviewDialogProps) => (
    <Dialog
        isOpen={isOpen}
        width={920}
        onClose={onClose}
        onRequestClose={onClose}
        contentClassName="p-0"
    >
        <div className="p-4 sm:p-5">
            <h4 className="mb-3 text-base font-semibold">{title}</h4>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={title}
                        className="mx-auto max-h-[75vh] w-full object-contain"
                    />
                ) : null}
            </div>
        </div>
    </Dialog>
)

export default LayoutPreviewDialog
