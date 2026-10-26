import fs from 'node:fs'
import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
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

const deleteSourceMaps = (outDir: string) => ({
    name: 'delete-source-maps',
    apply: 'build' as const,
    closeBundle() {
        const root = path.resolve(outDir)
        if (!fs.existsSync(root)) {
            return
        }

        const walk = (dir: string) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const fullPath = path.join(dir, entry.name)
                if (entry.isDirectory()) {
                    walk(fullPath)
                } else if (entry.name.endsWith('.map')) {
                    fs.rmSync(fullPath)
                }
            }
        }

        walk(root)
    },
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const remoteOrigin = resolveRemoteOrigin(env.VITE_API_BASE_URL)
    const outDir = process.env.BUILD_OUT_DIR || 'build'
    const sentryAuthToken = env.SENTRY_AUTH_TOKEN
    const sentryRelease = process.env.SENTRY_RELEASE || env.SENTRY_RELEASE

    return {
        plugins: [
            react(),
            dynamicImport(),
            sentryVitePlugin({
                url: env.SENTRY_URL || 'https://sentry.top-metr.ru',
                org: env.SENTRY_ORG,
                project: env.SENTRY_PROJECT,
                authToken: sentryAuthToken,
                disable: !sentryAuthToken,
                telemetry: false,
                errorHandler(error) {
                    throw error
                },
                release: {
                    ...(sentryRelease ? { name: sentryRelease } : {}),
                    create: false,
                    finalize: false,
                    setCommits: false,
                },
                sourcemaps: {
                    filesToDeleteAfterUpload: [`./${outDir}/**/*.map`],
                },
            }),
            deleteSourceMaps(outDir),
        ],
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
            outDir,
            sourcemap: 'hidden',
        },
    }
})
