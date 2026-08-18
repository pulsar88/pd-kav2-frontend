export const serializeArticleContentForApi = (html: string) =>
    JSON.stringify({ html })

export const parseArticleContentFromApi = (raw?: string | null) => {
    if (!raw?.trim()) {
        return ''
    }

    try {
        const parsed: unknown = JSON.parse(raw)

        if (typeof parsed === 'string') {
            return parsed
        }

        if (parsed && typeof parsed === 'object' && 'html' in parsed) {
            const html = (parsed as { html?: unknown }).html
            if (typeof html === 'string') {
                return html
            }
        }
    } catch {
        return raw
    }

    return raw
}

export const stripHtmlToPlainText = (html: string) =>
    html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

export const buildArticlePreviewText = (html: string, maxLength = 160) => {
    const plain = stripHtmlToPlainText(html)

    if (!plain) {
        return 'Новая статья'
    }

    if (plain.length <= maxLength) {
        return plain
    }

    return `${plain.slice(0, maxLength - 1).trim()}…`
}
