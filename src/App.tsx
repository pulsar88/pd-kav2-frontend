import { useEffect } from 'react'
import { BrowserRouter } from 'react-router'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import CookieBanner from '@/components/shared/CookieBanner'
import PwaInstallBanner from '@/components/shared/PwaInstallBanner'
import UpdateWindowBanner from '@/components/shared/UpdateWindowBanner'
import UserLogsBroadcastListener from '@/components/template/Notification/UserLogsBroadcastListener'
import ServerUnavailableGate from '@/components/template/ServerUnavailableGate'
import UserBlockedGate from '@/components/template/UserBlockedGate'
import { useUserBlockedStore } from '@/store/userBlockedStore'
import useAppVersionCheck from '@/utils/hooks/useAppVersionCheck'
import Views from '@/views'

function App() {
    useEffect(() => {
        const handleCopy = (event: ClipboardEvent) => {
            const selection = window.getSelection()?.toString() || ''
            const trimmed = selection.trim()
            const digits = trimmed.replace(/\D/g, '')

            // Меняем только явно отформатированный российский номер,
            // не затрагивая обычный текст и копирование из полей ввода.
            if (
                !/^\+?7(?:[\s().-]*\d){10}$/.test(trimmed) ||
                digits.length !== 11 ||
                !/[\s().-]/.test(trimmed)
            ) {
                return
            }

            const normalized = `+${digits}`
            event.preventDefault()
            event.clipboardData?.setData('text/plain', normalized)
            event.clipboardData?.setData('text/html', normalized)
        }

        document.addEventListener('copy', handleCopy)
        return () => document.removeEventListener('copy', handleCopy)
    }, [])

    const {
        hasNewVersion,
        isUpdateBannerDismissed,
        dismissUpdateBanner,
    } = useAppVersionCheck()

    const showUpdateBanner = hasNewVersion && !isUpdateBannerDismissed
    const isUserBlocked = useUserBlockedStore((state) => state.isBlocked)

    return (
        <>
            {showUpdateBanner ? (
                <UpdateWindowBanner
                    allowDismiss
                    onDismiss={dismissUpdateBanner}
                />
            ) : null}

            <Theme>
                <BrowserRouter>
                    <AuthProvider>
                        <UserLogsBroadcastListener />
                        {isUserBlocked ? (
                            <UserBlockedGate />
                        ) : (
                            <>
                                <Layout>
                                    <Views />
                                </Layout>
                                <CookieBanner />
                                <PwaInstallBanner />
                                <ServerUnavailableGate />
                            </>
                        )}
                    </AuthProvider>
                </BrowserRouter>
            </Theme>
        </>
    )
}

export default App
