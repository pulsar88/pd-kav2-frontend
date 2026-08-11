import Avatar from '@/components/ui/Avatar'
import IconText from '@/components/shared/IconText'
import classNames from '@/utils/classNames'
import { useNavigate } from 'react-router'
import { TbEye, TbMessage } from 'react-icons/tb'
import { categoryIcon, categoryLabel } from '../utils'

type ArticleItemProps = {
    id: string
    isLastChild: boolean
    category: string
    title: string
    timeToRead: number
    viewCount: number
    commentCount: number
}

const ArticleItem = ({
    id,
    isLastChild,
    category,
    title,
    timeToRead,
    viewCount,
    commentCount,
}: ArticleItemProps) => {
    const navigate = useNavigate()

    return (
        <div
            className={classNames(
                'group flex cursor-pointer items-center justify-between border-gray-200 py-6 dark:border-gray-700',
                isLastChild && 'border-b',
            )}
            role="button"
            onClick={() => navigate(`/help/${category}/${id}`)}
        >
            <div className="flex items-center gap-4">
                <Avatar
                    className="bg-gray-100 dark:bg-gray-700"
                    size={50}
                    icon={
                        <span className="heading-text">
                            {categoryIcon[category]}
                        </span>
                    }
                    shape="round"
                />
                <div>
                    <h6 className="font-bold group-hover:text-primary">
                        {title}
                    </h6>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{timeToRead} мин</span>
                        <span>•</span>
                        <span>{categoryLabel[category] || category}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <IconText
                    className="font-semibold"
                    icon={<TbEye className="text-xl" />}
                >
                    {viewCount}
                </IconText>
                <IconText
                    className="font-semibold"
                    icon={<TbMessage className="text-xl" />}
                >
                    {commentCount}
                </IconText>
            </div>
        </div>
    )
}

export default ArticleItem
