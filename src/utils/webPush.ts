import {
    apiPushSubscribe,
    apiPushUnsubscribe,
} from '@/services/PushService'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() || ''

export type PushSubscribeResult =
    | { status: 'subscribed' }
    | { status: 'unsupported' }
    | { status: 'denied' }
    | { status: 'missing_vapid' }
    | { status: 'error'; message: string }

export function isWebPushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; i += 1) {
        outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        return null
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        })
        await navigator.serviceWorker.ready
        return registration
    } catch (error) {
        console.error('Service worker registration failed', error)
        return null
    }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
    if (!isWebPushSupported()) {
        return null
    }

    const registration =
        (await navigator.serviceWorker.getRegistration()) ??
        (await registerServiceWorker())

    if (!registration) {
        return null
    }

    return registration.pushManager.getSubscription()
}

function toSubscribePayload(subscription: PushSubscription) {
    const json = subscription.toJSON()
    const endpoint = json.endpoint
    const p256dh = json.keys?.p256dh
    const auth = json.keys?.auth

    if (!endpoint || !p256dh || !auth) {
        throw new Error('Некорректная push-подписка')
    }

    return {
        endpoint,
        keys: {
            p256dh,
            auth,
        },
    }
}

export async function syncPushSubscription(
    subscription: PushSubscription,
): Promise<void> {
    await apiPushSubscribe(toSubscribePayload(subscription))
}

/**
 * Нужно ли показывать диалог после логина/регистрации.
 * Если подписка уже есть — тихо синхронизируем с бэком и не спрашиваем.
 * Если permission уже granted — подписываемся без диалога.
 */
export async function preparePushPromptAfterAuth(): Promise<{
    shouldPrompt: boolean
}> {
    if (!isWebPushSupported() || !VAPID_PUBLIC_KEY) {
        return { shouldPrompt: false }
    }

    if (Notification.permission === 'denied') {
        return { shouldPrompt: false }
    }

    const existing = await getExistingPushSubscription()
    if (existing) {
        try {
            await syncPushSubscription(existing)
        } catch (error) {
            console.error('Failed to sync existing push subscription', error)
        }
        return { shouldPrompt: false }
    }

    if (Notification.permission === 'granted') {
        const result = await subscribeToWebPush()
        return { shouldPrompt: result.status !== 'subscribed' }
    }

    return { shouldPrompt: true }
}

export async function subscribeToWebPush(): Promise<PushSubscribeResult> {
    if (!isWebPushSupported()) {
        return { status: 'unsupported' }
    }

    if (!VAPID_PUBLIC_KEY) {
        return { status: 'missing_vapid' }
    }

    try {
        const permission =
            Notification.permission === 'granted'
                ? 'granted'
                : await Notification.requestPermission()

        if (permission !== 'granted') {
            return { status: 'denied' }
        }

        const registration =
            (await navigator.serviceWorker.getRegistration()) ??
            (await registerServiceWorker())

        if (!registration) {
            return {
                status: 'error',
                message: 'Не удалось зарегистрировать service worker',
            }
        }

        let subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    VAPID_PUBLIC_KEY,
                ) as BufferSource,
            })
        }

        await syncPushSubscription(subscription)
        return { status: 'subscribed' }
    } catch (error) {
        console.error('Web push subscribe failed', error)
        return {
            status: 'error',
            message:
                error instanceof Error
                    ? error.message
                    : 'Не удалось оформить подписку',
        }
    }
}

export async function unsubscribeFromWebPush(): Promise<void> {
    const subscription = await getExistingPushSubscription()
    if (!subscription) {
        return
    }

    const endpoint = subscription.endpoint

    try {
        await apiPushUnsubscribe({ endpoint })
    } catch (error) {
        console.error('Failed to unsubscribe push on backend', error)
    }

    await subscription.unsubscribe()
}
