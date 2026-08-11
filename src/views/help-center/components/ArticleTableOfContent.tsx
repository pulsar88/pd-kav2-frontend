import Card from '@/components/ui/Card'
import Affix from '@/components/shared/Affix'
import useLayoutGap from '@/utils/hooks/useLayoutGap'
import useResponsive from '@/utils/hooks/useResponsive'
// eslint-disable-next-line import/named
import { Link } from 'react-scroll'

type ArticleTableOfContentProps = {
    content: { id: string; label: string }[]
}

const ArticleTableOfContent = ({ content }: ArticleTableOfContentProps) => {
    const { getTopGapValue } = useLayoutGap()
    const { larger } = useResponsive()

    if (!larger.lg || content.length === 0) {
        return null
    }

    return (
        <div className="mt-6 md:px-8 lg:w-[320px]">
            <Affix offset={getTopGapValue()}>
                <Card>
                    <h6 className="font-bold">На этой странице</h6>
                    <ul className="relative mt-4 font-medium text-gray-500 dark:text-gray-400">
                        {content.map((link) => (
                            <li key={`anchor${link.id}`}>
                                <Link
                                    activeClass="text-primary dark:text-gray-50 after:content-[''] after:absolute after:-left-5 after:bg-primary after:w-[2px] after:h-5"
                                    className="block cursor-pointer py-2 transition-colors duration-200 hover:text-primary dark:hover:text-gray-100"
                                    to={link.id}
                                    spy={true}
                                    smooth={true}
                                    duration={500}
                                    offset={-80}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
            </Affix>
        </div>
    )
}

export default ArticleTableOfContent
