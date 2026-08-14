import React from 'react'
import ReactDOM from 'react-dom/client'
import appConfig from '@/configs/app.config'
import { registerServiceWorker } from '@/utils/webPush'
import App from './App'
import './index.css'

async function prepareApp() {
    if (appConfig.enableMock) {
        await import('./mock')
    }

    // SW нужен и в dev (localhost) — иначе webpush не протестировать локально
    void registerServiceWorker()
}

prepareApp().then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
})
