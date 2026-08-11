import { useEffect, useMemo, useState } from 'react'

import { useNavigate, useParams } from 'react-router'

import useSWR from 'swr'

import classNames from '@/utils/classNames'

import Button from '@/components/ui/Button'

import Tabs from '@/components/ui/Tabs'

import AdaptiveCard from '@/components/shared/AdaptiveCard'

import Container from '@/components/shared/Container'

import Loading from '@/components/shared/Loading'

import {
    apiGetCheckboard,
    apiGetComplexes,
    apiSearchPremises,
} from '@/services/ObjectsService'

import { TbArrowLeft } from 'react-icons/tb'

import type { CheckboardCellLabel } from './checkboard.types'
import type { ObjectsSearchFilters } from './types'

import {

    collectStatuses,

    findBuildingPropertyById,
    flattenBuildingProperties,

} from './checkboardUtils'

import CheckboardClassic from './components/checkboard/CheckboardClassic'

import CheckboardLegend from './components/checkboard/CheckboardLegend'

import CheckboardPlus from './components/checkboard/CheckboardPlus'

import CheckboardPropertyDrawer from './components/checkboard/CheckboardPropertyDrawer'
import ObjectsSearchForm from './components/ObjectsSearchForm'
import {
    createEmptyObjectsSearchFilters,
    parseObjectsSearchFilters,
    serializeObjectsSearchFilters,
} from './filtersQuery'



const { TabList, TabNav, TabContent } = Tabs

const syncSearchStateInUrl = (
    filters: ObjectsSearchFilters,
    propertyId: number | null,
) => {
    const url = new URL(window.location.href)
    const params = serializeObjectsSearchFilters(filters)

    if (propertyId != null) {
        params.set('property_id', String(propertyId))
    }

    url.search = params.toString()
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState(window.history.state, '', next)
}

const ComplexCheckboard = () => {

    const { id } = useParams()

    const navigate = useNavigate()
    const initialFilters = useMemo(
        () => createEmptyObjectsSearchFilters(id || ''),
        [id],
    )

    const [view, setView] = useState('classic')

    const [labelMode, setLabelMode] = useState<CheckboardCellLabel>('rooms')

    const [draftFilters, setDraftFilters] =
        useState<ObjectsSearchFilters>(initialFilters)

    const [appliedFilters, setAppliedFilters] =
        useState<ObjectsSearchFilters>(initialFilters)
    const [activeStatusCode, setActiveStatusCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [matchingPropertyIds, setMatchingPropertyIds] = useState<Set<number> | null>(
        null,
    )

    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
        null,
    )
    const [detailsPanelOpen, setDetailsPanelOpen] = useState(false)



    const { data, isLoading } = useSWR(

        id ? ['/api/objects/checkboard', id] : null,

        () => apiGetCheckboard(id || ''),

        {

            revalidateOnFocus: false,

            revalidateIfStale: false,

            revalidateOnReconnect: false,

        },

    )

    const { data: complexes = [] } = useSWR(
        '/api/objects/complexes',
        () => apiGetComplexes(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )



    const selectedProperty = useMemo(() => {

        if (!data || selectedPropertyId == null) return null

        return findBuildingPropertyById(data, selectedPropertyId) ?? null

    }, [data, selectedPropertyId])

    useEffect(() => {
        if (selectedPropertyId == null) return

        let secondFrame = 0

        const scrollToProperty = () => {
            const element = document.querySelector<HTMLElement>(
                `[data-property-id="${selectedPropertyId}"]`,
            )

            if (!element) return

            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            })
        }

        const firstFrame = window.requestAnimationFrame(() => {
            secondFrame = window.requestAnimationFrame(scrollToProperty)
        })

        return () => {
            window.cancelAnimationFrame(firstFrame)
            if (secondFrame) {
                window.cancelAnimationFrame(secondFrame)
            }
        }
    }, [selectedPropertyId, view])



    useEffect(() => {
        if (!data) return

        const nextFilters = parseObjectsSearchFilters(
            window.location.search,
            id || '',
        )
        setDraftFilters(nextFilters)
        setAppliedFilters(nextFilters)

        const param = new URLSearchParams(window.location.search).get('property_id')
        if (!param) return

        const parsed = Number(param)
        if (!Number.isFinite(parsed)) return
        if (findBuildingPropertyById(data, parsed)) {
            setSelectedPropertyId(parsed)
            setDetailsPanelOpen(true)
        }
    }, [data, id])



    const currentComplex = useMemo(
        () => complexes.find((item) => item.id === id) ?? null,
        [complexes, id],
    )

    useEffect(() => {
        let cancelled = false

        const loadMatches = async () => {
            if (!id) return

            setIsSearching(true)

            try {
                const results = await apiSearchPremises({
                    ...appliedFilters,
                    complexId: id,
                })

                if (!cancelled) {
                    setMatchingPropertyIds(
                        new Set(
                            results.map((item) => item.checkboardPropertyId),
                        ),
                    )
                }
            } finally {
                if (!cancelled) {
                    setIsSearching(false)
                }
            }
        }

        void loadMatches()

        return () => {
            cancelled = true
        }
    }, [appliedFilters, id])

    const allProperties = useMemo(
        () => (data ? flattenBuildingProperties(data) : []),
        [data],
    )

    const activePropertyIds = useMemo(() => {
        if (!data || !matchingPropertyIds) return null

        const visible = new Set<number>()

        allProperties.forEach((property) => {
            if (!matchingPropertyIds.has(property.id)) return
            if (activeStatusCode && property.status.code !== activeStatusCode) return
            visible.add(property.id)
        })

        return visible
    }, [activeStatusCode, allProperties, data, matchingPropertyIds])

    const stats = useMemo(() => {
        if (!data || !activePropertyIds) {
            return { total: 0, available: 0 }
        }

        let total = 0
        let available = 0

        allProperties.forEach((property) => {
            if (!activePropertyIds.has(property.id)) return
            total += 1
            if (property.status.is_available) {
                available += 1
            }
        })

        return { total, available }
    }, [activePropertyIds, allProperties, data])



    const statuses = useMemo(() => (data ? collectStatuses(data) : []), [data])



    const handleApplyFilters = () => {
        const nextFilters = {
            ...draftFilters,
            complexId: id || '',
        }

        setDraftFilters(nextFilters)
        setAppliedFilters(nextFilters)
        syncSearchStateInUrl(nextFilters, selectedPropertyId)
    }



    const handleResetFilters = () => {
        const nextFilters = createEmptyObjectsSearchFilters(id || '')

        setDraftFilters(nextFilters)
        setAppliedFilters(nextFilters)
        syncSearchStateInUrl(nextFilters, selectedPropertyId)
    }



    const handleStatusClick = (code: string) => {
        setActiveStatusCode((prev) => (prev === code ? '' : code))
    }



    const handlePropertySelect = (propertyId: number) => {
        setSelectedPropertyId(propertyId)
        setDetailsPanelOpen(true)
        syncSearchStateInUrl(appliedFilters, propertyId)
    }

    const handleCloseDrawer = () => {
        setDetailsPanelOpen(false)
        setSelectedPropertyId(null)
        syncSearchStateInUrl(appliedFilters, null)
    }



    return (

        <Container>

            <AdaptiveCard>

                <Loading loading={isLoading}>

                    {!data ? (
                        <div className="py-10 text-center text-sm text-gray-500">
                            Шахматка не найдена
                        </div>

                    ) : (

                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="mb-3"
                                        icon={<TbArrowLeft />}
                                        onClick={() => {
                                            const params =
                                                serializeObjectsSearchFilters({
                                                    ...appliedFilters,
                                                    complexId: '',
                                                })
                                            params.delete('property_id')
                                            const query = params.toString()
                                            navigate(
                                                query
                                                    ? `/objects?${query}`
                                                    : '/objects',
                                            )
                                        }}
                                    >

                                        К списку ЖК

                                    </Button>

                                    <h3 className="mb-1">{data.name}</h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400">

                                        Шахматка помещений по секциям

                                    </p>

                                </div>

                            </div>



                            <ObjectsSearchForm
                                complexes={currentComplex ? [currentComplex] : []}
                                filters={draftFilters}
                                isSearching={isSearching}
                                desktopActionsInGrid
                                onCollapsedChange={() => {}}
                                onChange={setDraftFilters}
                                onSearch={() => void handleApplyFilters()}
                                onReset={handleResetFilters}
                            />

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                                    Всего:{' '}
                                    <span className="ml-1 text-base tabular-nums">
                                        {stats.total}
                                    </span>
                                </span>
                                <span className="inline-flex items-center rounded-lg bg-[#a4f4cf] px-2.5 py-1 text-sm font-semibold text-[#006045]">
                                    Свободно:{' '}
                                    <span className="ml-1 text-base tabular-nums">
                                        {stats.available}
                                    </span>
                                </span>
                            </div>



                            <CheckboardLegend

                                statuses={statuses}

                                activeStatusCode={activeStatusCode}

                                onStatusClick={handleStatusClick}

                            />



                            <Tabs

                                value={view}

                                onChange={(value) => setView(value)}

                            >

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <TabList>

                                        <TabNav

                                            value="classic"

                                            className="!px-2.5 sm:!px-5"

                                        >

                                            Шахматка

                                        </TabNav>

                                        <TabNav

                                            value="plus"

                                            className="!px-2.5 sm:!px-5"

                                        >

                                            Шахматка+

                                        </TabNav>

                                    </TabList>



                                    {view === 'classic' ? (

                                        <div className="flex items-center gap-1.5">

                                            <span className="text-sm text-gray-500">

                                                Показывать:

                                            </span>

                                            {(

                                                [

                                                    {

                                                        value: 'rooms',

                                                        label: 'Комнатность',

                                                    },

                                                    {

                                                        value: 'number',

                                                        label: 'Номер',

                                                    },

                                                ] as const

                                            ).map((item) => (

                                                <button

                                                    key={item.value}

                                                    type="button"

                                                    className={classNames(

                                                        'rounded-lg px-2.5 py-1.5 text-sm transition-colors',

                                                        labelMode === item.value

                                                            ? 'bg-primary text-white'

                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200',

                                                    )}

                                                    onClick={() =>

                                                        setLabelMode(item.value)

                                                    }

                                                >

                                                    {item.label}

                                                </button>

                                            ))}

                                        </div>

                                    ) : null}

                                </div>



                                <div className="mt-5">

                                    <TabContent value="classic">

                                        <CheckboardClassic

                                            building={data}

                                            labelMode={labelMode}

                                            activePropertyIds={activePropertyIds}

                                            selectedPropertyId={

                                                selectedPropertyId

                                            }

                                            onPropertySelect={

                                                handlePropertySelect

                                            }

                                        />

                                    </TabContent>

                                    <TabContent value="plus">

                                        <CheckboardPlus

                                            building={data}

                                            activePropertyIds={activePropertyIds}

                                            selectedPropertyId={

                                                selectedPropertyId

                                            }

                                            onPropertySelect={

                                                handlePropertySelect

                                            }

                                        />

                                    </TabContent>

                                </div>

                            </Tabs>

                        </div>

                    )}

                </Loading>

            </AdaptiveCard>

            <CheckboardPropertyDrawer
                isOpen={detailsPanelOpen}
                property={selectedProperty}
                complexId={id}
                onClose={handleCloseDrawer}
            />

        </Container>

    )

}



export default ComplexCheckboard


