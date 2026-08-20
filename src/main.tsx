import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerServiceWorker } from '@/utils/webPush'
import App from './App'
import './index.css'

async function prepareApp() {
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
