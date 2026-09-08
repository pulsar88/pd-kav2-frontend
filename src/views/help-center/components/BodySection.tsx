import Card from '@/components/ui/Card'
import ArticleList from './ArticleList'
import { useSearchParams } from 'react-router'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import classNames from '@/utils/classNames'

const BodySection = () => {
    const [searchParams] = useSearchParams()
    const queryText = searchParams.get('q')?.trim() || ''

    return (
        <div className={classNames('my-12 min-w-0 w-full', PAGE_CONTAINER_GUTTER_X)}>
            <Card className="w-full">
                <ArticleList query={queryText} />
            </Card>
        </div>
    )
}

export default BodySection
