import { useCallback, useEffect, useState } from 'react'
import {
    getDeferredPrompt,
    isIosInstallHintAvailable,
    isStandaloneDisplay,
    promptPwaInstall,
    subscribePwaInstall,
} from '@/utils/pwaInstall'

const usePwaInstall = () => {
    const [canInstall, setCanInstall] = useState(
        () => getDeferredPrompt() !== null,
    )
    const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay())
    const [showIosHint, setShowIosHint] = useState(() =>
        isIosInstallHintAvailable(),
    )

    useEffect(() => {
        const sync = () => {
            setCanInstall(getDeferredPrompt() !== null)
            setIsInstalled(isStandaloneDisplay())
            setShowIosHint(isIosInstallHintAvailable())
        }

        sync()

        const mediaQuery = window.matchMedia('(display-mode: standalone)')
        mediaQuery.addEventListener('change', sync)

        const unsubscribe = subscribePwaInstall(sync)

        return () => {
            mediaQuery.removeEventListener('change', sync)
            unsubscribe()
        }
    }, [])

    const install = useCallback(() => promptPwaInstall(), [])

    return {
        canInstall,
        isInstalled,
        showIosHint,
        install,
    }
}

export default usePwaInstall
