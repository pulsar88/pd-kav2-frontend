import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import usePwaInstall from '@/utils/hooks/usePwaInstall'
import { TbDeviceMobile } from 'react-icons/tb'

const PwaInstallCard = () => {
    const { canInstall, isInstalled, showIosHint, install } = usePwaInstall()
    const [isInstalling, setIsInstalling] = useState(false)

    if (isInstalled || (!canInstall && !showIosHint)) {
        return null
    }

    const handleInstall = async () => {
        setIsInstalling(true)
        try {
            await install()
        } finally {
            setIsInstalling(false)
        }
    }

    return (
        <Card
            className="h-full flex flex-col"
            bodyClass="flex-1"
            header={{
                content: (
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle text-primary text-xl shrink-0">
                            <TbDeviceMobile />
                        </span>
                        <div>
                            <h4 className="mb-1">Установить приложение</h4>
                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                Добавьте маркетплейс на рабочий стол и открывайте
                                его как обычное приложение
                            </p>
                        </div>
                    </div>
                ),
                bordered: true,
            }}
        >
            {canInstall ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Браузер готов установить приложение. Это займёт пару
                        секунд и не требует магазина приложений.
                    </p>
                    <Button
                        variant="solid"
                        className="w-full shrink-0 sm:w-auto"
                        loading={isInstalling}
                        disabled={isInstalling}
                        onClick={() => {
                            void handleInstall()
                        }}
                    >
                        Установить
                    </Button>
                </div>
            ) : (
                <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
                    <li>Нажмите кнопку «Поделиться» внизу Safari</li>
                    <li>Выберите «На экран „Домой“»</li>
                    <li>Подтвердите установку</li>
                </ol>
            )}
        </Card>
    )
}

export default PwaInstallCard
