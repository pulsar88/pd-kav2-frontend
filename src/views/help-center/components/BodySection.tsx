import Container from '@/components/shared/Container'
import Categories from './Categories'
import ArticleList from './ArticleList'
import { useSearchParams } from 'react-router'

/** На /help показываем карточки или результаты поиска */
const BodySection = () => {
    const [searchParams] = useSearchParams()
    const queryText = searchParams.get('q')?.trim() || ''

    return (
        <div className="my-12">
            <Container>
                <div className="mx-auto max-w-[1200px] px-6">
                    {queryText ? (
                        <ArticleList query={queryText} topic="" />
                    ) : (
                        <Categories />
                    )}
                </div>
            </Container>
        </div>
    )
}

export default BodySection
