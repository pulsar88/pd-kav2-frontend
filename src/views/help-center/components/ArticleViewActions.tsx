import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { TbArrowNarrowLeft, TbEdit, TbTrash } from 'react-icons/tb'

type ArticleViewActionsProps = {
    onBack: () => void
    canManage?: boolean
    isDraft?: boolean
    onEdit?: () => void
    onDelete?: () => void
}

const ArticleViewActions = ({
    onBack,
    canManage = false,
    isDraft = false,
    onEdit,
    onDelete,
}: ArticleViewActionsProps) => {
    return (
        <StickyFooter
            className="mt-4 flex min-w-0 shrink-0 items-center justify-between gap-2 bg-white py-3 dark:bg-gray-800"
            stickyClass="-mx-4 border-t border-gray-200 px-4 dark:border-gray-700 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8"
            defaultClass="rounded-xl border border-gray-200 px-4 dark:border-gray-600 sm:px-6 md:px-8"
        >
            <Button
                className="min-w-0 shrink-0"
                variant="plain"
                size="sm"
                icon={<TbArrowNarrowLeft className="text-lg" />}
                onClick={onBack}
            >
                <span className="truncate">Назад</span>
            </Button>
            {canManage ? (
                <div className="flex min-w-0 shrink-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
                    {isDraft ? (
                        <Tag className="shrink-0 border-amber-200 bg-amber-50 text-[10px] font-semibold leading-tight text-amber-600 sm:text-xs dark:border-amber-700/50 dark:bg-amber-500/20">
                            Черновик
                        </Tag>
                    ) : null}
                    <Button
                        className="shrink-0"
                        variant="solid"
                        size="sm"
                        icon={<TbEdit />}
                        onClick={onEdit}
                    >
                        <span className="hidden min-[400px]:inline">
                            Редактировать
                        </span>
                    </Button>
                    <Button
                        className="shrink-0 border border-error text-error hover:bg-error/10 hover:text-error"
                        variant="plain"
                        size="sm"
                        icon={<TbTrash />}
                        onClick={onDelete}
                    >
                        <span className="hidden min-[400px]:inline">
                            Удалить
                        </span>
                    </Button>
                </div>
            ) : null}
        </StickyFooter>
    )
}

export default ArticleViewActions
