import { BrowserRouter } from 'react-router'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import CookieBanner from '@/components/shared/CookieBanner'
import UserLogsBroadcastListener from '@/components/template/Notification/UserLogsBroadcastListener'
import ServerUnavailableGate from '@/components/template/ServerUnavailableGate'
import Views from '@/views'

function App() {
    return (
        <Theme>
            <BrowserRouter>
                <AuthProvider>
                    <UserLogsBroadcastListener />
                    <Layout>
                        <Views />
                    </Layout>
                    <CookieBanner />
                    <ServerUnavailableGate />
                </AuthProvider>
            </BrowserRouter>
        </Theme>
    )
}

export default App
