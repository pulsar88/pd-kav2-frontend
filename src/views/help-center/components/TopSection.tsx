import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Button from '@/components/ui/Button'
import Container from '@/components/shared/Container'
import { TbSearch } from 'react-icons/tb'
import { useNavigate, useSearchParams } from 'react-router'
import { usePublicationKind } from '../publicationKind'

type TopSectionProps = {
    showSearch?: boolean
}

const SEARCH_DEBOUNCE_MS = 400

const TopSection = ({ showSearch = true }: TopSectionProps) => {
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState(
        () => searchParams.get('q')?.trim() || '',
    )
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const currentQuery = searchParams.get('q')?.trim() || ''

    // Синхронизируем инпут с URL (при переходах между разделами и обратно)
    useEffect(() => {
        setQuery(currentQuery)
    }, [kind.kind, currentQuery])

    useEffect(
        () => () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current)
                searchTimerRef.current = null
            }
        },
        [],
    )

    const applyQuery = (value: string) => {
        const trimmed = value.trim()
        if (trimmed === currentQuery) return

        navigate(
            trimmed
                ? `${kind.basePath}?q=${encodeURIComponent(trimmed)}`
                : kind.basePath,
            { replace: true },
        )
    }

    const scheduleSearch = (value: string) => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current)
        }
        searchTimerRef.current = setTimeout(() => {
            searchTimerRef.current = null
            applyQuery(value)
        }, SEARCH_DEBOUNCE_MS)
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value)
        scheduleSearch(event.target.value)
    }

    const handleSearchClick = () => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current)
            searchTimerRef.current = null
        }
        applyQuery(query)
    }

    return (
        <section className="flex h-[260px] flex-col justify-center bg-primary/10 dark:bg-primary/20">
            <Container className="flex flex-col items-center px-4">
                <div className="mb-6 flex flex-col items-center">
                    <h2 className="mb-3 text-center">{kind.title}</h2>
                    <p className="max-w-[420px] text-center text-gray-600 dark:text-gray-300">
                        {kind.description}
                    </p>
                </div>
                {showSearch ? (
                    <div className="flex min-h-[50px] w-full max-w-[800px] flex-col rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex h-[56px] w-full items-center gap-2">
                        <input
                                value={query}
                                className="heading-text h-full flex-1 bg-transparent font-semibold placeholder:font-semibold placeholder:text-gray-400 focus:outline-hidden"
                                placeholder={kind.searchPlaceholder}
                                onChange={handleInputChange}
                            />
                            <Button
                                size="xs"
                                shape="circle"
                                variant="solid"
                                icon={<TbSearch />}
                                onClick={handleSearchClick}
                            />
                        </div>
                    </div>
                ) : null}
            </Container>
        </section>
    )
}

export default TopSection
