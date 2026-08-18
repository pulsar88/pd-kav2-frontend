import { useEffect, useState } from 'react'
import ArticleCard from './ArticleCard'
import { apiGetSupportHubArticles } from '@/services/HelpCenterService'
import NoDataFound from '@/assets/svg/NoDataFound'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import Spinner from '@/components/ui/Spinner'
import Select from '@/components/ui/Select'
import useSWR from 'swr'
import { TbArrowNarrowLeft, TbPlus } from 'react-icons/tb'
import { useNavigate } from 'react-router'
import { DEFAULT_HELP_CENTER_PAGE_SIZE } from '../helpCenterApiQuery'
import { publicationListKey } from '../helpCenterQuery'
import { usePublicationKind } from '../publicationKind'

type Option = {
    value: number
    label: string
}

const pageSizeOptions: Option[] = [20, 50, 100].map((value) => ({
    value,
    label: `${value} / стр.`,
}))

type ArticleListProps = {
    query?: string
}

const ArticleList = ({ query = '' }: ArticleListProps) => {
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_HELP_CENTER_PAGE_SIZE)

    useEffect(() => {
        setPageIndex(1)
    }, [query, pageSize, kind.kind])

    const { data, isLoading } = useSWR(
        publicationListKey(kind.listEndpoint, query, pageIndex, pageSize),
        () =>
            apiGetSupportHubArticles(
                {
                    query,
                    page: pageIndex,
                    page_size: pageSize,
                },
                kind.listEndpoint,
            ),
        {
            revalidateOnFocus: false,
        },
    )

    const articles = data?.list ?? []
    const totalCount = data?.total ?? 0

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                {query ? (
                    <h3 className="flex min-w-0 flex-1 items-center gap-4">
                        <button
                            type="button"
                            className="shrink-0 rounded-full bg-gray-100 p-2 text-xl text-gray-800 outline-hidden transition-colors hover:bg-primary/10 hover:text-primary dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-primary/20 dark:hover:text-primary"
                            onClick={() => navigate(kind.basePath)}
                        >
                            <TbArrowNarrowLeft />
                        </button>
                        <span className="min-w-0 truncate">
                            <span className="font-normal">
                                Результаты по запросу:{' '}
                            </span>
                            <span className="font-semibold">{query}</span>
                        </span>
                    </h3>
                ) : (
                    <h3 className="mb-0">{kind.listHeading}</h3>
                )}
                <Button
                    variant="solid"
                    size="sm"
                    className="shrink-0"
                    icon={<TbPlus />}
                    onClick={() => navigate(`${kind.basePath}/create`)}
                >
                    {kind.createLabel}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex min-h-48 items-center justify-center">
                    <Spinner size={36} />
                </div>
            ) : null}

            {!isLoading && articles.length === 0 ? (
                <div className="mt-12 text-center">
                    <div className="flex justify-center">
                        <NoDataFound height={240} width={240} />
                    </div>
                    <h3 className="mt-6">
                        {query ? kind.notFoundTitle : kind.emptyTitle}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {query
                            ? 'Попробуйте изменить запрос или вернитесь к списку'
                            : kind.emptyHint}
                    </p>
                    {query ? (
                        <button
                            type="button"
                            className="mt-4 text-primary hover:underline"
                            onClick={() => navigate(kind.basePath)}
                        >
                            {kind.showAllLabel}
                        </button>
                    ) : (
                        <Button
                            className="mt-4"
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={() => navigate(`${kind.basePath}/create`)}
                        >
                            {kind.createLabel}
                        </Button>
                    )}
                </div>
            ) : null}

            {!isLoading && articles.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {articles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                id={article.id}
                                title={article.title}
                                previewText={article.previewText}
                                timeToRead={article.timeToRead}
                            />
                        ))}
                    </div>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="overflow-x-auto">
                            <Pagination
                                currentPage={pageIndex}
                                pageSize={pageSize}
                                total={totalCount}
                                pagerCount={5}
                                onChange={setPageIndex}
                            />
                        </div>
                        <div
                            className="shrink-0 self-end sm:self-auto"
                            style={{ minWidth: 130 }}
                        >
                            <Select
                                instanceId={`${kind.kind}-page-size`}
                                size="sm"
                                menuPlacement="top"
                                isSearchable={false}
                                value={pageSizeOptions.filter(
                                    (option) => option.value === pageSize,
                                )}
                                options={pageSizeOptions}
                                onChange={(option) => {
                                    const size = (option as Option | null)
                                        ?.value
                                    if (typeof size === 'number') {
                                        setPageSize(size)
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    )
}

export default ArticleList
