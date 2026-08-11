import { useRef } from 'react'
import Button from '@/components/ui/Button'
import Container from '@/components/shared/Container'
import { TbSearch } from 'react-icons/tb'
import { useNavigate } from 'react-router'

type TopSectionProps = {
    showSearch?: boolean
}

const TopSection = ({ showSearch = true }: TopSectionProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    const handleSetQueryText = () => {
        const value = inputRef.current?.value?.trim()
        if (value) {
            navigate(`/help?q=${encodeURIComponent(value)}`)
        }
    }

    return (
        <section className="flex h-[260px] flex-col justify-center bg-primary/10 dark:bg-primary/20">
            <Container className="flex flex-col items-center px-4">
                <div className="mb-6 flex flex-col items-center">
                    <h2 className="mb-3 text-center">Центр помощи</h2>
                    <p className="max-w-[420px] text-center text-gray-600 dark:text-gray-300">
                        Ищите ответы, листайте разделы и открывайте статьи по
                        работе с кабинетом агента.
                    </p>
                </div>
                {showSearch ? (
                    <div className="flex min-h-[50px] w-full max-w-[800px] flex-col rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex h-[56px] w-full items-center gap-2">
                            <input
                                ref={inputRef}
                                className="heading-text h-full flex-1 bg-transparent font-semibold placeholder:font-semibold placeholder:text-gray-400 focus:outline-hidden"
                                placeholder="Поиск по статьям"
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        handleSetQueryText()
                                    }
                                    if (
                                        event.key === 'Backspace' &&
                                        (event.target as HTMLInputElement)
                                            .value.length <= 1
                                    ) {
                                        navigate('/help')
                                    }
                                }}
                            />
                            <Button
                                size="xs"
                                shape="circle"
                                variant="solid"
                                icon={<TbSearch />}
                                onClick={handleSetQueryText}
                            />
                        </div>
                    </div>
                ) : null}
            </Container>
        </section>
    )
}

export default TopSection
