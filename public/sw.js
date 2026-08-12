/* global self, clients */

const DEFAULT_ICON = '/img/pwa/icon-192.png'

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
    let payload = {
        title: 'Уведомление',
        body: '',
        icon: DEFAULT_ICON,
        badge: DEFAULT_ICON,
        data: {},
    }

    try {
        if (event.data) {
            const data = event.data.json()
            payload = {
                ...payload,
                ...data,
                icon: data.icon || DEFAULT_ICON,
                badge: data.badge || DEFAULT_ICON,
                data: data.data || {},
            }
        }
    } catch {
        try {
            const text = event.data?.text()
            if (text) {
                payload.body = text
            }
        } catch {
            // ignore malformed payload
        }
    }

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon,
            badge: payload.badge,
            image: payload.image,
            tag: payload.tag,
            renotify: payload.renotify,
            requireInteraction: payload.requireInteraction,
            actions: payload.actions,
            data: payload.data,
            vibrate: payload.vibrate,
        }),
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const targetUrl = event.notification.data?.url || '/'

    event.waitUntil(
        (async () => {
            const url = new URL(targetUrl, self.location.origin).href
            const windowClients = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            })

            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    await client.focus()
                    if ('navigate' in client) {
                        await client.navigate(url)
                    }
                    return
                }
            }

            if (clients.openWindow) {
                await clients.openWindow(url)
            }
        })(),
    )
})
