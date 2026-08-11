import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import useSWR from 'swr'
import Tabs from '@/components/ui/Tabs'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Loading from '@/components/shared/Loading'
import {
    apiGetComplexes,
    apiSearchPremises,
} from '@/services/ObjectsService'
import type { Premise, ObjectsSearchFilters } from './types'
import ComplexCard from './components/ComplexCard'
import ObjectsSearchForm from './components/ObjectsSearchForm'
import ObjectsPremisesResults from './components/ObjectsPremisesResults'
import {
    createEmptyObjectsSearchFilters,
    parseObjectsSearchFilters,
    serializeObjectsSearchFilters,
} from './filtersQuery'
import { countPremisesByComplex } from './utils'

const { TabList, TabNav, TabContent } = Tabs

const emptyFilters = createEmptyObjectsSearchFilters()

const hasActiveFilters = (filters: ObjectsSearchFilters) => {
    const params = serializeObjectsSearchFilters({
        ...filters,
        complexId: '',
    })
    return params.toString().length > 0
}

const Objects = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [activeTab, setActiveTab] = useState('complexes')
    const [filters, setFilters] = useState<ObjectsSearchFilters>(() =>
        parseObjectsSearchFilters(window.location.search),
    )
    const [filtersCollapsed, setFiltersCollapsed] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<Premise[]>([])
    const restoredFromUrlRef = useRef(false)

    const { data: complexes = [], isLoading } = useSWR(
        '/api/objects/complexes',
        () => apiGetComplexes(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const countsByComplex = useMemo(
        () => countPremisesByComplex(results),
        [results],
    )

    const syncFiltersToUrl = (nextFilters: ObjectsSearchFilters) => {
        const params = serializeObjectsSearchFilters({
            ...nextFilters,
            complexId: '',
        })
        setSearchParams(params, { replace: true })
    }

    const handleSearch = async (
        nextFilters: ObjectsSearchFilters = filters,
    ) => {
        setIsSearching(true)
        try {
            const list = await apiSearchPremises(nextFilters)
            setResults(list)
            setHasSearched(true)
            syncFiltersToUrl(nextFilters)
        } finally {
            setIsSearching(false)
        }
    }

    const handleReset = () => {
        setFilters(emptyFilters)
        setResults([])
        setHasSearched(false)
        setFiltersCollapsed(false)
        setSearchParams({}, { replace: true })
    }

    useEffect(() => {
        if (restoredFromUrlRef.current) return
        restoredFromUrlRef.current = true

        const nextFilters = parseObjectsSearchFilters(searchParams.toString())
        setFilters(nextFilters)

        if (!hasActiveFilters(nextFilters)) return

        setFiltersCollapsed(true)
        setIsSearching(true)

        void apiSearchPremises(nextFilters)
            .then((list) => {
                setResults(list)
                setHasSearched(true)
            })
            .finally(() => {
                setIsSearching(false)
            })
    }, [searchParams])

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-5">
                    <div>
                        <h3 className="mb-1">Каталог помещений</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Жилые комплексы и подбор помещений по параметрам
                        </p>
                    </div>

                    <ObjectsSearchForm
                        complexes={complexes}
                        filters={filters}
                        isSearching={isSearching}
                        multiComplexSelect
                        collapsed={filtersCollapsed}
                        onCollapsedChange={setFiltersCollapsed}
                        onChange={setFilters}
                        onSearch={() => void handleSearch()}
                        onReset={handleReset}
                    />

                    <Tabs
                        value={activeTab}
                        onChange={(value) => setActiveTab(value)}
                    >
                        <TabList>
                            <TabNav
                                value="complexes"
                                className="!px-2.5 sm:!px-5"
                            >
                                Жилые комплексы
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
                                <Loading loading={isLoading}>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {complexes.map((complex) => (
                                            <ComplexCard
                                                key={complex.id}
                                                complex={complex}
                                                searchFilters={filters}
                                                matchingPremisesCount={
                                                    hasSearched
                                                        ? countsByComplex[
                                                              complex.id
                                                          ] ?? 0
                                                        : undefined
                                                }
                                            />
                                        ))}
                                    </div>
                                </Loading>
                            </TabContent>

                            <TabContent value="premises">
                                {hasSearched ? (
                                    <ObjectsPremisesResults
                                        results={results}
                                        searchFilters={filters}
                                    />
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
                                        Задайте параметры и нажмите «Найти
                                        помещения»
                                    </div>
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
