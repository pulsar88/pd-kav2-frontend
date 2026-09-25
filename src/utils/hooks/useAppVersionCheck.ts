import { useEffect, useState } from 'react'

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000
const PRELOAD_RELOAD_FLAG = 'app:preload-reload'

type UseAppVersionCheckResult = {
    hasNewVersion: boolean
    isUpdateBannerDismissed: boolean
    dismissUpdateBanner: () => void
}

const useAppVersionCheck = (): UseAppVersionCheckResult => {
    const [hasNewVersion, setHasNewVersion] = useState(false)
    const [isUpdateBannerDismissed, setIsUpdateBannerDismissed] =
        useState(false)

    useEffect(() => {
        if (import.meta.env.DEV) {
            return
        }

        // Сбрасываем флаг только после успешной работы страницы,
        // иначе при повторном 404 chunk'а возможен цикл reload.
        const clearReloadFlagTimer = window.setTimeout(() => {
            try {
                sessionStorage.removeItem(PRELOAD_RELOAD_FLAG)
            } catch {
                // ignore
            }
        }, 5000)

        let baselineEtag: string | null = null

        const handlePreloadError = (event: Event) => {
            event.preventDefault()

            try {
                if (sessionStorage.getItem(PRELOAD_RELOAD_FLAG) === '1') {
                    return
                }
                sessionStorage.setItem(PRELOAD_RELOAD_FLAG, '1')
            } catch {
                // sessionStorage недоступен — всё равно пробуем один reload
            }

            window.location.reload()
        }

        window.addEventListener('vite:preloadError', handlePreloadError)

        const checkVersion = async () => {
            try {
                const res = await fetch(`${import.meta.env.BASE_URL}index.html`, {
                    method: 'HEAD',
                    cache: 'no-store',
                })
                const etag =
                    res.headers.get('etag') || res.headers.get('last-modified')

                if (baselineEtag === null) {
                    baselineEtag = etag
                    return
                }

                if (etag && etag !== baselineEtag) {
                    setHasNewVersion(true)
                    setIsUpdateBannerDismissed(false)
                }
            } catch (error) {
                console.error('Error checking version:', error)
            }
        }

        void checkVersion()
        const interval = window.setInterval(
            checkVersion,
            VERSION_CHECK_INTERVAL_MS,
        )

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void checkVersion()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.clearTimeout(clearReloadFlagTimer)
            window.clearInterval(interval)
            window.removeEventListener('vite:preloadError', handlePreloadError)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    return {
        hasNewVersion,
        isUpdateBannerDismissed,
        dismissUpdateBanner: () => setIsUpdateBannerDismissed(true),
    }
}

export default useAppVersionCheck
