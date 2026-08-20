import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'
import { TbArrowNarrowLeft, TbDeviceFloppy } from 'react-icons/tb'

type ArticleFormActionsProps = {
    saveLabel: string
    isSaving?: boolean
    onBack: () => void
    onSave: () => void
}

const ArticleFormActions = ({
    saveLabel,
    isSaving = false,
    onBack,
    onSave,
}: ArticleFormActionsProps) => {
    return (
        <StickyFooter
            className="mt-4 flex items-center justify-between bg-white py-4 dark:bg-gray-800"
            stickyClass="-mx-4 border-t border-gray-200 px-8 dark:border-gray-700 sm:-mx-8"
            defaultClass="container mx-auto rounded-xl border border-gray-200 px-8 dark:border-gray-600"
        >
            <div className="container mx-auto">
                <div className="flex items-center justify-between gap-3">
                    <Button
                        className="shrink-0"
                        variant="plain"
                        icon={<TbArrowNarrowLeft />}
                        onClick={onBack}
                    >
                        Назад
                    </Button>
                    <Button
                        className="shrink-0"
                        variant="solid"
                        icon={<TbDeviceFloppy />}
                        loading={isSaving}
                        onClick={onSave}
                    >
                        {saveLabel}
                    </Button>
                </div>
            </div>
        </StickyFooter>
    )
}

export default ArticleFormActions
