import React from 'react'
import ReactDOM from 'react-dom/client'
import appConfig from '@/configs/app.config'
import App from './App'
import './index.css'

async function prepareApp() {
    if (appConfig.enableMock) {
        await import('./mock')
    }
}

prepareApp().then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
})
