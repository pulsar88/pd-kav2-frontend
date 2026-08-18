import Container from '@/components/shared/Container'
import ArticleList from './ArticleList'
import { useSearchParams } from 'react-router'

const BodySection = () => {
    const [searchParams] = useSearchParams()
    const queryText = searchParams.get('q')?.trim() || ''

    return (
        <div className="my-12 min-w-0">
            <Container>
                <div className="mx-auto min-w-0 max-w-[1200px] px-4 sm:px-6">
                    <ArticleList query={queryText} />
                </div>
            </Container>
        </div>
    )
}

export default BodySection
