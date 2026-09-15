import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import usePwaInstall from '@/utils/hooks/usePwaInstall'
import { TbDeviceMobile, TbX } from 'react-icons/tb'

const STORAGE_KEY = 'pwaInstallBannerDismissed'

const PwaInstallBanner = () => {
    const { canInstall, isInstalled, showIosHint, install } = usePwaInstall()
    const [isDismissed, setIsDismissed] = useState(
        () => localStorage.getItem(STORAGE_KEY) === 'true',
    )
    const [isInstalling, setIsInstalling] = useState(false)

    const isVisible =
        !isDismissed && !isInstalled && (canInstall || showIosHint)

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true')
        setIsDismissed(true)
    }

    const handleInstall = async () => {
        setIsInstalling(true)
        try {
            const outcome = await install()
            if (outcome === 'accepted') {
                handleDismiss()
            }
        } finally {
            setIsInstalling(false)
        }
    }

    return (
        <AnimatePresence>
            {isVisible ? (
                <motion.div
                    className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 32 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                    <div className="pointer-events-auto relative flex w-full flex-col items-stretch gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:gap-4 sm:pr-12">
                        <button
                            type="button"
                            aria-label="Закрыть"
                            className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            onClick={handleDismiss}
                        >
                            <TbX className="text-lg" />
                        </button>
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-xl text-primary">
                                <TbDeviceMobile />
                            </span>
                            <div className="min-w-0">
                                <h3 className="mb-0.5 text-sm font-bold heading-text">
                                    Установить приложение
                                </h3>
                                <p className="text-xs leading-snug text-gray-600 dark:text-gray-300">
                                    {showIosHint && !canInstall
                                        ? 'Нажмите «Поделиться» в Safari и выберите «На экран „Домой“».'
                                        : 'Откройте маркетплейс как приложение — без адресной строки и быстрее с рабочего стола.'}
                                </p>
                            </div>
                        </div>
                        {canInstall ? (
                            <Button
                                variant="solid"
                                size="sm"
                                className="w-full shrink-0 sm:w-auto"
                                loading={isInstalling}
                                disabled={isInstalling}
                                onClick={() => {
                                    void handleInstall()
                                }}
                            >
                                Установить
                            </Button>
                        ) : null}
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}

export default PwaInstallBanner
