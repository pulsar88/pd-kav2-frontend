import { useEffect, useState } from 'react'

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000

type UseAppVersionCheckResult = {
    hasNewVersion: boolean
    isPreloadBlocked: boolean
    isUpdateBannerDismissed: boolean
    dismissUpdateBanner: () => void
}

const useAppVersionCheck = (): UseAppVersionCheckResult => {
    const [hasNewVersion, setHasNewVersion] = useState(false)
    const [isPreloadBlocked, setIsPreloadBlocked] = useState(false)
    const [isUpdateBannerDismissed, setIsUpdateBannerDismissed] =
        useState(false)

    useEffect(() => {
        if (import.meta.env.DEV) {
            return
        }

        let baselineEtag: string | null = null

        const handlePreloadError = () => {
            setIsPreloadBlocked(true)
            setIsUpdateBannerDismissed(false)
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

        return () => {
            window.clearInterval(interval)
            window.removeEventListener('vite:preloadError', handlePreloadError)
        }
    }, [])

    return {
        hasNewVersion,
        isPreloadBlocked,
        isUpdateBannerDismissed,
        dismissUpdateBanner: () => setIsUpdateBannerDismissed(true),
    }
}

export default useAppVersionCheck
