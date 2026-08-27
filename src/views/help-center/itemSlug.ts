export const buildItemSlug = (id: string, code?: string): string =>
    code ? `${id}-${code}` : id

export const parseItemSlug = (
    slug: string,
): { id?: string; code?: string } => {
    const [head, ...rest] = slug.split('-')

    return {
        id: /^\d+$/.test(head) ? head : undefined,
        code: rest.length > 0 ? rest.join('-') : undefined,
    }
}