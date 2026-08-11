export default function acronym(name = '') {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => {
            const letter = part.match(
                /[\p{L}\p{N}]/u,
            )
            return letter?.[0] ?? ''
        })
        .filter(Boolean)

    if (parts.length >= 2) {
        return (parts[0] + parts[1]).toUpperCase()
    }

    if (parts[0]) {
        return parts[0].toUpperCase()
    }

    return name
}
