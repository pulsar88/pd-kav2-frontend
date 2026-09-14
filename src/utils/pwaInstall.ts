export type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
}

type PwaInstallListener = () => void

const listeners = new Set<PwaInstallListener>()

let deferredPrompt: BeforeInstallPromptEvent | null = null
let listenersAttached = false

function notify() {
    listeners.forEach((listener) => listener())
}

export function isStandaloneDisplay(): boolean {
    if (typeof window === 'undefined') {
        return false
    }

    const nav = window.navigator as Navigator & { standalone?: boolean }

    return (
        nav.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches
    )
}

export function isIosDevice(): boolean {
    if (typeof navigator === 'undefined') {
        return false
    }

    const ua = navigator.userAgent
    const isIpadOs =
        navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

    return /iPhone|iPad|iPod/i.test(ua) || isIpadOs
}

export function isIosInstallHintAvailable(): boolean {
    return isIosDevice() && !isStandaloneDisplay()
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
    return deferredPrompt
}

export function subscribePwaInstall(listener: PwaInstallListener): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export async function promptPwaInstall(): Promise<
    'accepted' | 'dismissed' | 'unavailable'
> {
    if (!deferredPrompt) {
        return 'unavailable'
    }

    const promptEvent = deferredPrompt
    deferredPrompt = null
    notify()

    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    return outcome
}

function handleBeforeInstallPrompt(event: Event) {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
}

function handleAppInstalled() {
    deferredPrompt = null
    notify()
}

export function capturePwaInstallEvents() {
    if (typeof window === 'undefined' || listenersAttached) {
        return
    }

    listenersAttached = true
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
}
