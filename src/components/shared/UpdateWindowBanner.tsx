import { AnimatePresence, motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { TbRefresh, TbX } from 'react-icons/tb'

type UpdateWindowBannerProps = {
    allowDismiss?: boolean
    onDismiss?: () => void
}

const UpdateWindowBanner = ({
    allowDismiss = true,
    onDismiss,
}: UpdateWindowBannerProps) => {
    const handleReload = () => {
        window.location.reload()
    }

    return (
        <AnimatePresence>
            <motion.div
                className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center p-3"
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
                <div className="pointer-events-auto relative flex w-full flex-col items-stretch gap-3 rounded-xl border border-primary/30 bg-white px-4 py-3 shadow-lg dark:border-primary/40 dark:bg-gray-800 sm:flex-row sm:items-center sm:gap-4 sm:pr-12">
                    {allowDismiss ? (
                        <button
                            type="button"
                            aria-label="Закрыть"
                            className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            onClick={onDismiss}
                        >
                            <TbX className="text-lg" />
                        </button>
                    ) : null}
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-xl text-primary">
                            <TbRefresh />
                        </span>
                        <div className="min-w-0">
                            <h3 className="mb-0.5 text-sm font-bold heading-text">
                                Доступна новая версия
                            </h3>
                            <p className="text-xs leading-snug text-gray-600 dark:text-gray-300">
                                Обновите страницу, чтобы продолжить работу с
                                актуальной версией приложения.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="solid"
                        size="sm"
                        className="w-full shrink-0 sm:w-auto"
                        icon={<TbRefresh />}
                        onClick={handleReload}
                    >
                        Обновить
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

export default UpdateWindowBanner
