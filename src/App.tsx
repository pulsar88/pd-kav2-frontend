import { BrowserRouter } from 'react-router'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import CookieBanner from '@/components/shared/CookieBanner'
import Views from '@/views'

function App() {
    return (
        <Theme>
            <BrowserRouter>
                <AuthProvider>
                    <Layout>
                        <Views />
                    </Layout>
                    <CookieBanner />
                </AuthProvider>
            </BrowserRouter>
        </Theme>
    )
}

export default App
