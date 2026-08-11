import Container from '@/components/shared/Container'
import TopSection from './components/TopSection'
import ArticleList from './components/ArticleList'
import { useParams } from 'react-router'

/** Список статей раздела: /help/:topic */
const TopicArticles = () => {
    const { topic = '' } = useParams()

    return (
        <>
            <TopSection showSearch={false} />
            <div className="my-12">
                <Container>
                    <div className="mx-auto max-w-[1200px] px-6">
                        <ArticleList topic={topic} query="" />
                    </div>
                </Container>
            </div>
        </>
    )
}

export default TopicArticles
