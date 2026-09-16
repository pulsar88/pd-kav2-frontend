import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
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
            className="mt-4 flex min-w-0 shrink-0 items-center justify-between bg-white py-3 dark:bg-gray-800 sm:py-4"
            stickyClass="-mx-4 border-t border-gray-200 px-4 dark:border-gray-700 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8"
            defaultClass="rounded-xl border border-gray-200 px-4 dark:border-gray-600 sm:px-6 md:px-8"
        >
            <div className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-2">
                <Button
                    className="min-w-0 shrink-0"
                    variant="plain"
                    size="sm"
                    icon={<TbArrowNarrowLeft className="text-lg" />}
                    disabled={isSaving}
                    onClick={onBack}
                >
                    <span className="truncate">Назад</span>
                </Button>
                <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
                    <Tooltip title="Сохранить черновик">
                        <Button
                            className="shrink-0"
                            variant="default"
                            size="sm"
                            icon={<TbDeviceFloppy />}
                            loading={isSaving && savingAsDraft}
                            disabled={isSaving}
                            aria-label="Сохранить черновик"
                            onClick={onSaveDraft}
                        >
                            <span className="hidden sm:inline">
                                Сохранить черновик
                            </span>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Опубликовать">
                        <Button
                            className="shrink-0"
                            variant="solid"
                            size="sm"
                            icon={<TbSend />}
                            loading={isSaving && !savingAsDraft}
                            disabled={isSaving}
                            aria-label="Опубликовать"
                            onClick={onPublish}
                        >
                            <span className="hidden sm:inline">
                                Опубликовать
                            </span>
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </StickyFooter>
    )
}

export default ArticleFormActions
