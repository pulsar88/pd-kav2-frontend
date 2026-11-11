export type ResponsiveImageVariant = {
    width: number
    height: number
    name: string
}

export type MediaImage = {
    src?: string
    url?: string
    base_url?: string
    url_path?: string
    responsive_path?: string
    responsive?: ResponsiveImageVariant[]
}

export type MediaSource = MediaImage | string | null | undefined

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

const asString = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value : undefined

const isResponsiveVariant = (value: unknown): value is ResponsiveImageVariant => {
    if (!isRecord(value)) return false

    return (
        typeof value.width === 'number' &&
        typeof value.height === 'number' &&
        typeof value.name === 'string' &&
        value.name.length > 0
    )
}

const joinMediaUrl = (baseUrl: string, path: string) =>
    encodeURI(`${baseUrl}${path}`)

const getLargestVariantSrc = (media: MediaImage) => {
    if (!media.responsive?.length || !media.base_url || !media.responsive_path) {
        return ''
    }

    const largest = media.responsive.reduce<ResponsiveImageVariant | undefined>(
        (current, variant) => {
            if (variant.width <= 0 || !variant.name) return current
            if (!current || variant.width > current.width) return variant
            return current
        },
        undefined,
    )

    if (!largest) return ''

    return joinMediaUrl(
        media.base_url,
        `${media.responsive_path}${largest.name}`,
    )
}

/** WebP-конверсия для карточки. Исходный файл — запасной вариант. */
export const getMediaSrc = (media: MediaSource): string => {
    if (!media) return ''
    if (typeof media === 'string') return media

    if (media.base_url && media.url_path) {
        return joinMediaUrl(media.base_url, media.url_path)
    }

    return media.src || media.url || getLargestVariantSrc(media)
}

export const normalizeMediaImage = (
    value: unknown,
    depth = 0,
): MediaImage | undefined => {
    if (depth > 2 || value == null) return undefined

    if (typeof value === 'string') {
        const src = value.trim()
        return src ? { src } : undefined
    }

    if (!isRecord(value)) return undefined

    if (isRecord(value.image)) {
        const nested = normalizeMediaImage(value.image, depth + 1)
        if (nested) return nested
    }

    const responsive = Array.isArray(value.responsive)
        ? value.responsive.filter(isResponsiveVariant)
        : undefined
    const src =
        asString(value.src) ||
        asString(value.url) ||
        asString(value.image) ||
        asString(value.image_url) ||
        asString(value.original_url) ||
        asString(value.path)

    const image: MediaImage = {
        src,
        url: asString(value.url),
        base_url: asString(value.base_url),
        url_path: asString(value.url_path),
        responsive_path: asString(value.responsive_path),
        responsive: responsive?.length ? responsive : undefined,
    }

    if (!getMediaSrc(image)) return undefined

    return image
}

/**
 * Исходный файл. Нужен для зума, PDF и плана этажа:
 * контур помещения задан в координатах оригинала.
 */
export const getMediaOriginalSrc = (media: MediaSource): string => {
    if (!media) return ''
    if (typeof media === 'string') return media

    return media.src || media.url || getMediaSrc(media)
}

export const getMediaSrcSet = (media: MediaSource): string => {
    if (!media || typeof media === 'string') return ''
    const { responsive, base_url: baseUrl, responsive_path: responsivePath } =
        media

    if (!responsive?.length || !baseUrl || !responsivePath) {
        return ''
    }

    return responsive
        .filter((variant) => variant.width > 0 && variant.name)
        .map(
            (variant) =>
                `${joinMediaUrl(
                    baseUrl,
                    `${responsivePath}${variant.name}`,
                )} ${variant.width}w`,
        )
        .join(', ')
}

/** Один URL не шире нужного слота, если есть responsive-варианты. */
export const getMediaFittedSrc = (
    media: MediaSource,
    targetWidth: number,
): string => {
    if (!media || typeof media === 'string') return getMediaSrc(media)
    if (!media.responsive?.length || !media.base_url || !media.responsive_path) {
        return getMediaSrc(media)
    }

    const variants = [...media.responsive]
        .filter((variant) => variant.width > 0 && variant.name)
        .sort((left, right) => left.width - right.width)

    const match =
        variants.find((variant) => variant.width >= targetWidth) ??
        variants[variants.length - 1]

    if (!match) return getMediaSrc(media)

    return joinMediaUrl(
        media.base_url,
        `${media.responsive_path}${match.name}`,
    )
}

export const getResponsiveImageAttrs = (
    media: MediaSource,
    sizes: string,
): { src: string; srcSet?: string; sizes?: string } => {
    const src = getMediaSrc(media)
    const srcSet = getMediaSrcSet(media)

    if (!srcSet) return { src }

    return { src, srcSet, sizes }
}
