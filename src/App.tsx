import { BrowserRouter } from 'react-router'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import CookieBanner from '@/components/shared/CookieBanner'
import PwaInstallBanner from '@/components/shared/PwaInstallBanner'
import UpdateWindowBanner from '@/components/shared/UpdateWindowBanner'
import UserLogsBroadcastListener from '@/components/template/Notification/UserLogsBroadcastListener'
import ServerUnavailableGate from '@/components/template/ServerUnavailableGate'
import useAppVersionCheck from '@/utils/hooks/useAppVersionCheck'
import Views from '@/views'

function App() {
    const {
        hasNewVersion,
        isUpdateBannerDismissed,
        dismissUpdateBanner,
    } = useAppVersionCheck()

    const showUpdateBanner = hasNewVersion && !isUpdateBannerDismissed

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
                        <Layout>
                            <Views />
                        </Layout>
                        <CookieBanner />
                        <PwaInstallBanner />
                        <ServerUnavailableGate />
                    </AuthProvider>
                </BrowserRouter>
            </Theme>
        </>
    )
}

export default App
