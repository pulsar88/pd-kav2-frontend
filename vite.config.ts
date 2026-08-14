import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dynamicImport from 'vite-plugin-dynamic-import'

const resolveRemoteOrigin = (apiBaseUrl?: string) => {
    if (!apiBaseUrl) {
        return 'http://localhost:3000'
    }

    try {
        return new URL(apiBaseUrl).origin
    } catch {
        return 'http://localhost:3000'
    }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const remoteOrigin = resolveRemoteOrigin(env.VITE_API_BASE_URL)

    return {
        plugins: [react(), dynamicImport()],
        assetsInclude: ['**/*.md'],
        resolve: {
            alias: {
                '@': path.join(__dirname, 'src'),
            },
        },
        server: {
            headers: {
                'Service-Worker-Allowed': '/',
            },
            proxy: {
                '/api': {
                    target: remoteOrigin,
                    changeOrigin: true,
                    secure: true,
                },
                '/broadcasting': {
                    target: remoteOrigin,
                    changeOrigin: true,
                    secure: true,
                },
                '/soketi': {
                    target: remoteOrigin,
                    changeOrigin: true,
                    secure: true,
                    ws: true,
                },
            },
        },
        preview: {
            headers: {
                'Service-Worker-Allowed': '/',
            },
        },
        build: {
            outDir: 'build',
        },
    }
})
