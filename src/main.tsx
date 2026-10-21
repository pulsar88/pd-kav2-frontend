import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react";
import { capturePwaInstallEvents } from '@/utils/pwaInstall'
import { registerServiceWorker } from '@/utils/webPush'
import App from './App'
import './index.css'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim()

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.01, // 1% of transactions — adjust to your needs
  })
}

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
