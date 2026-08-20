export const useTranslation = () => {
    const t = (
        _: string,
        fallback?: string | Record<string, string | number>,
    ) => {
        if (typeof fallback === 'string') {
            return fallback
        }

        return ''
    }

    return {
        t,
        ready: true,
    }
}

export default useTranslation
