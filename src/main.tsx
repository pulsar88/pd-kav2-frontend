import React from 'react'
import ReactDOM from 'react-dom/client'
import { capturePwaInstallEvents } from '@/utils/pwaInstall'
import { registerServiceWorker } from '@/utils/webPush'
import App from './App'
import './index.css'

async function prepareApp() {
    // Слушатель должен стоять до регистрации SW: Chrome шлёт beforeinstallprompt сразу после него
    capturePwaInstallEvents()
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
