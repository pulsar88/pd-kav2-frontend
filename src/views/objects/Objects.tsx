import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import useSWR from 'swr'
import Tabs from '@/components/ui/Tabs'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import {
    apiGetRealtyProperties,
    apiGetRealtyPropertiesSummary,
} from '@/services/ObjectsService'
import type { ObjectsSearchFilters } from './types'
import ComplexCard from './components/ComplexCard'
import ComplexesGridSkeleton from './components/ComplexesGridSkeleton'
import ObjectsSearchForm from './components/ObjectsSearchForm'
import ObjectsPremisesResults from './components/ObjectsPremisesResults'
import PremisesListSkeleton from './components/PremisesListSkeleton'
import {
    appendObjectsCatalogTab,
    createEmptyObjectsSearchFilters,
    hasActiveObjectsSearchFilters,
    parseObjectsCatalogTab,
    parseObjectsSearchFilters,
    serializeObjectsSearchFilters,
    type ObjectsCatalogTab,
} from './filtersQuery'
import type { PremiseSortKey, PremiseSortState } from './utils'

const { TabList, TabNav, TabContent } = Tabs

const emptyFilters = createEmptyObjectsSearchFilters()

const pageSizeOptions = [20, 50, 100].map((number) => ({
    value: number,
    label: `${number} / стр.`,
}))

type PageSizeOption = { value: number; label: string }

const hasAppliedCatalogFilters = (filters: ObjectsSearchFilters) =>
    hasActiveObjectsSearchFilters(filters)

const Objects = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const filtersFromUrl = useMemo(
        () => parseObjectsSearchFilters(location.search),
        [location.search],
    )
    const filtersKeyFromUrl = useMemo(
        () => serializeObjectsSearchFilters(filtersFromUrl).toString(),
        [filtersFromUrl],
    )
    const tabFromUrl = useMemo(
        () => parseObjectsCatalogTab(location.search),
        [location.search],
    )

    const [activeTab, setActiveTab] = useState<ObjectsCatalogTab>(tabFromUrl)
    const [filters, setFilters] = useState<ObjectsSearchFilters>(filtersFromUrl)
    const [appliedFilters, setAppliedFilters] =
        useState<ObjectsSearchFilters>(filtersFromUrl)
    const [filtersCollapsed, setFiltersCollapsed] = useState(
        () => hasAppliedCatalogFilters(filtersFromUrl),
    )
    const [premisesPage, setPremisesPage] = useState(1)
    const [premisesPageSize, setPremisesPageSize] = useState(20)
    const [premisesSortKey, setPremisesSortKey] =
        useState<PremiseSortState>(null)
    const [complexesPage, setComplexesPage] = useState(1)
    const [complexesPageSize, setComplexesPageSize] = useState(20)
    const [hasOpenedPremisesTab, setHasOpenedPremisesTab] = useState(
        () => tabFromUrl === 'premises',
    )

    useEffect(() => {
        setFilters(filtersFromUrl)
        setAppliedFilters(filtersFromUrl)
        setFiltersCollapsed(hasAppliedCatalogFilters(filtersFromUrl))
        setPremisesPage(1)
        setComplexesPage(1)
    }, [filtersKeyFromUrl])

    useEffect(() => {
        setActiveTab(tabFromUrl)
    }, [tabFromUrl])

    useEffect(() => {
        if (activeTab === 'premises') {
            setHasOpenedPremisesTab(true)
        }
    }, [activeTab])

    const syncCatalogToUrl = (
        nextFilters: ObjectsSearchFilters,
        tab: ObjectsCatalogTab = activeTab,
    ) => {
        const params = appendObjectsCatalogTab(
            serializeObjectsSearchFilters(nextFilters),
            tab,
        )
        const query = params.toString()
        navigate(query ? `/objects?${query}` : '/objects', { replace: true })
    }

    const handleTabChange = (tab: string) => {
        const nextTab: ObjectsCatalogTab =
            tab === 'premises' ? 'premises' : 'complexes'
        setActiveTab(nextTab)
        syncCatalogToUrl(appliedFilters, nextTab)
    }

    const swrConfig = {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    } as const

    const appliedFiltersKey = useMemo(
        () => serializeObjectsSearchFilters(appliedFilters).toString(),
        [appliedFilters],
    )

    const summaryFiltersActive = hasAppliedCatalogFilters(appliedFilters)

    const {
        data: complexesData,
        isLoading: isComplexesSummaryLoading,
        mutate: mutateComplexesSummary,
    } = useSWR(
        [
            '/api/v2/realty_properties/summary',
            complexesPage,
            complexesPageSize,
            appliedFiltersKey,
        ],
        () =>
            apiGetRealtyPropertiesSummary({
                page: complexesPage,
                per_page: complexesPageSize,
                filters: summaryFiltersActive ? appliedFilters : undefined,
            }),
        swrConfig,
    )

    const filteredComplexes = complexesData?.items ?? []
    const complexesTotal = complexesData?.meta.total ?? 0

    const {
        data: premisesData,
        isLoading: isPremisesLoading,
        isValidating: isPremisesValidating,
        mutate: mutatePremises,
    } = useSWR(
        hasOpenedPremisesTab
            ? [
                  '/api/v2/realty_properties',
                  premisesPage,
                  premisesPageSize,
                  premisesSortKey,
                  appliedFiltersKey,
              ]
            : null,
        () =>
            apiGetRealtyProperties({
                page: premisesPage,
                per_page: premisesPageSize,
                sort: premisesSortKey ?? undefined,
                filters: hasActiveObjectsSearchFilters(appliedFilters)
                    ? appliedFilters
                    : undefined,
            }),
        {
            ...swrConfig,
            keepPreviousData: true,
        },
    )

    const showMatchingPremisesCount = hasAppliedCatalogFilters(appliedFilters)

    const premises = premisesData?.items ?? []
    const premisesTotal = premisesData?.meta.total ?? 0
    const isPremisesInitialLoading = isPremisesLoading && !premisesData
    const isPremisesRefreshing =
        isPremisesValidating && Boolean(premisesData)

    const handleFiltersChange = (nextFilters: ObjectsSearchFilters) => {
        setFilters(nextFilters)
    }

    const handleSearch = () => {
        const nextFiltersKey = serializeObjectsSearchFilters(filters).toString()
        const filtersUnchanged = nextFiltersKey === appliedFiltersKey

        setAppliedFilters(filters)
        setFiltersCollapsed(true)
        setPremisesPage(1)
        setComplexesPage(1)
        syncCatalogToUrl(filters)

        if (!filtersUnchanged) return

        void mutateComplexesSummary()
        if (hasOpenedPremisesTab) {
            void mutatePremises()
        }
    }

    const handleReset = () => {
        setFilters(emptyFilters)
        setAppliedFilters(emptyFilters)
        setFiltersCollapsed(false)
        setPremisesPage(1)
        setComplexesPage(1)
        syncCatalogToUrl(emptyFilters)
    }

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-5">
                    <div>
                        <h3 className="mb-1">Каталог помещений</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Дома и подбор помещений по параметрам
                        </p>
                    </div>

                    <ObjectsSearchForm
                        filters={filters}
                        isSearching={
                            isPremisesLoading || isComplexesSummaryLoading
                        }
                        hasAppliedFilters={hasActiveObjectsSearchFilters(
                            appliedFilters,
                        )}
                        multiComplexSelect
                        collapsed={filtersCollapsed}
                        onCollapsedChange={setFiltersCollapsed}
                        onChange={handleFiltersChange}
                        onSearch={handleSearch}
                        onReset={handleReset}
                    />

                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <TabList>
                            <TabNav
                                value="complexes"
                                className="!px-2.5 sm:!px-5"
                            >
                                Дома
                            </TabNav>
                            <TabNav
                                value="premises"
                                className="!px-2.5 sm:!px-5"
                            >
                                Помещения
                            </TabNav>
                        </TabList>

                        <div className="mt-5">
                            <TabContent value="complexes">
                                {isComplexesSummaryLoading ? (
                                    <ComplexesGridSkeleton />
                                ) : filteredComplexes.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
                                        По заданным параметрам дома не
                                        найдены
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <h4 className="mb-0 text-base font-semibold">
                                            {summaryFiltersActive
                                                ? `Найдено помещений: ${complexesTotal}`
                                                : `Всего помещений: ${complexesTotal}`}
                                        </h4>
                                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                            {filteredComplexes.map((complex) => (
                                                <ComplexCard
                                                    key={complex.id}
                                                    complex={complex}
                                                    matchingPremisesCount={
                                                        showMatchingPremisesCount
                                                            ? complex.matchingPremisesCount
                                                            : undefined
                                                    }
                                                    searchFilters={
                                                        appliedFilters
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="overflow-x-auto">
                                                <Pagination
                                                    currentPage={
                                                        complexesData?.meta
                                                            .current_page ??
                                                        complexesPage
                                                    }
                                                    pageSize={
                                                        complexesData?.meta
                                                            .per_page ??
                                                        complexesPageSize
                                                    }
                                                    total={complexesTotal}
                                                    pagerCount={5}
                                                    onChange={setComplexesPage}
                                                />
                                            </div>
                                            <div className="shrink-0 self-end sm:self-auto" style={{ minWidth: 130 }}>
                                                <Select
                                                    instanceId="objects-complexes-page-size"
                                                    size="sm"
                                                    menuPlacement="top"
                                                    isSearchable={false}
                                                    value={pageSizeOptions.filter(
                                                        (option) =>
                                                            option.value ===
                                                            complexesPageSize,
                                                    )}
                                                    options={pageSizeOptions}
                                                    onChange={(option) => {
                                                        const size = (
                                                            option as PageSizeOption | null
                                                        )?.value
                                                        if (
                                                            typeof size ===
                                                            'number'
                                                        ) {
                                                            setComplexesPageSize(
                                                                size,
                                                            )
                                                            setComplexesPage(1)
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabContent>

                            <TabContent value="premises">
                                {isPremisesInitialLoading ? (
                                    <PremisesListSkeleton />
                                ) : (
                                    <ObjectsPremisesResults
                                        results={premises}
                                        total={premisesTotal}
                                        pageIndex={
                                            premisesData?.meta.current_page ??
                                            premisesPage
                                        }
                                        pageSize={
                                            premisesData?.meta.per_page ??
                                            premisesPageSize
                                        }
                                        sortKey={premisesSortKey}
                                        isRefreshing={isPremisesRefreshing}
                                        filtersActive={hasActiveObjectsSearchFilters(
                                            appliedFilters,
                                        )}
                                        searchFilters={appliedFilters}
                                        onPageChange={setPremisesPage}
                                        onPageSizeChange={(size) => {
                                            setPremisesPageSize(size)
                                            setPremisesPage(1)
                                        }}
                                        onSortChange={(
                                            sortKey: PremiseSortState,
                                        ) => {
                                            setPremisesSortKey(sortKey)
                                            setPremisesPage(1)
                                        }}
                                    />
                                )}
                            </TabContent>
                        </div>
                    </Tabs>
                </div>
            </AdaptiveCard>
        </Container>
    )
}

export default Objects
