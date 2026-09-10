const INVITATION_TOKEN_KEY = 'agent-cabinet:invitation-token'

export const getInvitationTokenFromStorage = (): string | null => {
    try {
        const value = localStorage.getItem(INVITATION_TOKEN_KEY)
        return value?.trim() || null
    } catch {
        return null
    }
}

export const setInvitationTokenInStorage = (token: string): void => {
    try {
        const trimmed = token.trim()
        if (!trimmed) return
        localStorage.setItem(INVITATION_TOKEN_KEY, trimmed)
    } catch {
        // ignore quota / private mode
    }
}

export const clearInvitationTokenFromStorage = (): void => {
    try {
        localStorage.removeItem(INVITATION_TOKEN_KEY)
    } catch {
        // ignore
    }
}
