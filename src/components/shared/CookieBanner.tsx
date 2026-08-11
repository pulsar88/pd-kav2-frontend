import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { TbX } from 'react-icons/tb'

const STORAGE_KEY = 'isCookieBannerAccepted'

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(
        () => localStorage.getItem(STORAGE_KEY) !== 'true',
    )

    const handleAccept = () => {
        localStorage.setItem(STORAGE_KEY, 'true')
        setIsVisible(false)
    }

    const handleClose = () => {
        setIsVisible(false)
    }

    return (
        <AnimatePresence>
            {isVisible ? (
                <motion.div
                    className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 32 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                    <div className="pointer-events-auto relative flex w-full flex-col items-stretch gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:gap-4 sm:pr-12">
                        <button
                            type="button"
                            aria-label="Закрыть"
                            className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            onClick={handleClose}
                        >
                            <TbX className="text-lg" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h3 className="mb-0.5 text-sm font-bold heading-text">
                                Мы используем файлы cookies
                            </h3>
                            <p className="text-xs leading-snug text-gray-600 dark:text-gray-300">
                                Сайт agent-cabinet.ru использует файлы cookies и
                                сервисы сбора технических данных посетителей для
                                обеспечения работоспособности и улучшения
                                качества обслуживания. Продолжая использовать
                                наш сайт, вы автоматически соглашаетесь с
                                использованием данных технологий. Кликните
                                «Принять и закрыть», чтобы согласиться с
                                использованием «cookies» и больше не отображать
                                это предупреждение.
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            size="sm"
                            className="shrink-0 w-full sm:w-auto"
                            onClick={handleAccept}
                        >
                            Принять и закрыть
                        </Button>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}

export default CookieBanner
