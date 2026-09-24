import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { probeServerAvailability } from '@/services/serverProbe'
import { useServerStatusStore } from '@/store/serverStatusStore'
import { TbCloudOff, TbRefresh } from 'react-icons/tb'

const INITIAL_INTERVAL_MS = 5_000
const MAX_INTERVAL_MS = 30_000
const BACKOFF = 1.5
const MANUAL_COOLDOWN_MS = 5_000

const ServerUnavailableGate = () => {
    const isUnavailable = useServerStatusStore((s) => s.isUnavailable)
    const statusCode = useServerStatusStore((s) => s.statusCode)
    const clearServerOutage = useServerStatusStore((s) => s.clearServerOutage)

    const [isChecking, setIsChecking] = useState(false)
    const [isRecovering, setIsRecovering] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(
        Math.ceil(INITIAL_INTERVAL_MS / 1000),
    )
    const [manualCooldownLeft, setManualCooldownLeft] = useState(0)

    const intervalMsRef = useRef(INITIAL_INTERVAL_MS)
    const nextCheckAtRef = useRef(0)
    const nextManualAtRef = useRef(0)
    const isCheckingRef = useRef(false)
    const isRecoveringRef = useRef(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    const handleRecovered = useCallback(() => {
        isRecoveringRef.current = true
        setIsRecovering(true)
        clearServerOutage()
        window.setTimeout(() => {
            window.location.reload()
        }, 800)
    }, [clearServerOutage])

    const runProbe = useCallback(async (options?: { manual?: boolean }) => {
        if (isCheckingRef.current || isRecoveringRef.current) return false

        isCheckingRef.current = true
        setIsChecking(true)
        try {
            const ok = await probeServerAvailability()
            if (ok) {
                handleRecovered()
                return true
            }

            // После ручной проверки начинаем заново с короткого интервала.
            // Backoff наращиваем только на автоматических попытках.
            if (options?.manual) {
                intervalMsRef.current = INITIAL_INTERVAL_MS
            } else {
                intervalMsRef.current = Math.min(
                    Math.round(intervalMsRef.current * BACKOFF),
                    MAX_INTERVAL_MS,
                )
            }
            nextCheckAtRef.current = Date.now() + intervalMsRef.current
            setSecondsLeft(Math.ceil(intervalMsRef.current / 1000))
            return false
        } finally {
            isCheckingRef.current = false
            setIsChecking(false)
        }
    }, [handleRecovered])

    const handleCheckNow = () => {
        if (Date.now() < nextManualAtRef.current) return
        nextManualAtRef.current = Date.now() + MANUAL_COOLDOWN_MS
        setManualCooldownLeft(Math.ceil(MANUAL_COOLDOWN_MS / 1000))
        void runProbe({ manual: true })
    }

    useEffect(() => {
        if (!isUnavailable) {
            clearTimer()
            intervalMsRef.current = INITIAL_INTERVAL_MS
            nextManualAtRef.current = 0
            setSecondsLeft(Math.ceil(INITIAL_INTERVAL_MS / 1000))
            setManualCooldownLeft(0)
            isCheckingRef.current = false
            setIsChecking(false)
            return
        }

        nextCheckAtRef.current = Date.now() + intervalMsRef.current
        setSecondsLeft(Math.ceil(intervalMsRef.current / 1000))

        clearTimer()
        timerRef.current = setInterval(() => {
            const manualRemainingMs = nextManualAtRef.current - Date.now()
            setManualCooldownLeft(
                manualRemainingMs > 0
                    ? Math.max(1, Math.ceil(manualRemainingMs / 1000))
                    : 0,
            )

            if (
                isCheckingRef.current ||
                isRecoveringRef.current ||
                useServerStatusStore.getState().probing
            ) {
                return
            }

            const remainingMs = nextCheckAtRef.current - Date.now()
            if (remainingMs <= 0) {
                void runProbe()
                return
            }
            setSecondsLeft(Math.max(1, Math.ceil(remainingMs / 1000)))
        }, 250)

        return clearTimer
    }, [isUnavailable, runProbe])

    if (!isUnavailable && !isRecovering) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-100/95 p-4 backdrop-blur-sm dark:bg-gray-950/95 sm:p-6">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                    {isRecovering ? (
                        <Spinner size={28} />
                    ) : (
                        <TbCloudOff className="text-3xl" />
                    )}
                </div>

                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                    {isRecovering
                        ? 'Сервер снова доступен'
                        : 'Сервер временно недоступен'}
                </h3>

                <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {isRecovering
                        ? 'Обновляем страницу, чтобы подтянуть актуальные данные…'
                        : statusCode
                          ? `Получена ошибка ${statusCode}. Страницу обновлять не нужно — проверка идёт автоматически, и приложение само восстановится.`
                          : 'Страницу обновлять не нужно — проверка идёт автоматически, и приложение само восстановится.'}
                </p>

                {!isRecovering ? (
                    <div className="flex flex-col items-center gap-3">
                        <Button
                            variant="solid"
                            loading={isChecking}
                            disabled={manualCooldownLeft > 0}
                            icon={<TbRefresh />}
                            onClick={handleCheckNow}
                        >
                            {manualCooldownLeft > 0
                                ? `Подождите ${manualCooldownLeft} с`
                                : 'Проверить сейчас'}
                        </Button>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                            {isChecking
                                ? 'Проверяем доступность…'
                                : `Следующая проверка через ${secondsLeft} с`}
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default ServerUnavailableGate
