import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'
import { TbArrowNarrowLeft, TbDeviceFloppy, TbSend } from 'react-icons/tb'

type ArticleFormActionsProps = {
    isSaving?: boolean
    savingAsDraft?: boolean
    onBack: () => void
    onSaveDraft: () => void
    onPublish: () => void
}

const ArticleFormActions = ({
    isSaving = false,
    savingAsDraft = false,
    onBack,
    onSaveDraft,
    onPublish,
}: ArticleFormActionsProps) => {
    return (
        <StickyFooter
            className="mt-4 flex shrink-0 items-center justify-between bg-white py-4 dark:bg-gray-800"
            stickyClass="-mx-4 border-t border-gray-200 px-8 dark:border-gray-700 sm:-mx-8"
            defaultClass="container mx-auto rounded-xl border border-gray-200 px-8 dark:border-gray-600"
        >
            <div className="container mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                        className="shrink-0"
                        variant="plain"
                        icon={<TbArrowNarrowLeft />}
                        disabled={isSaving}
                        onClick={onBack}
                    >
                        Назад
                    </Button>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                            className="shrink-0"
                            variant="default"
                            icon={<TbDeviceFloppy />}
                            loading={isSaving && savingAsDraft}
                            disabled={isSaving}
                            onClick={onSaveDraft}
                        >
                            Сохранить черновик
                        </Button>
                        <Button
                            className="shrink-0"
                            variant="solid"
                            icon={<TbSend />}
                            loading={isSaving && !savingAsDraft}
                            disabled={isSaving}
                            onClick={onPublish}
                        >
                            Опубликовать
                        </Button>
                    </div>
                </div>
            </div>
        </StickyFooter>
    )
}

export default ArticleFormActions
