import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import classNames from '@/utils/classNames'
import Button from '@/components/ui/Button'
import Tabs from '@/components/ui/Tabs'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Loading from '@/components/shared/Loading'
import {
    apiGetCheckboard,
    apiGetRealtyObject,
    apiGetRealtyProperty,
} from '@/services/ObjectsService'
import { TbArrowLeft, TbZoomIn, TbZoomOut } from 'react-icons/tb'
import type {
    CheckboardBuilding,
    CheckboardCellLabel,
} from './checkboard.types'
import type { Complex, ObjectsSearchFilters, Premise } from './types'
import {
    collectStatuses,
    findBuildingPropertyById,
    flattenBuildingProperties,
    getDefaultActiveStatusCodes,
    matchesObjectsSearchFilters,
} from './checkboardUtils'
import CheckboardClassic from './components/checkboard/CheckboardClassic'
import CheckboardLegend from './components/checkboard/CheckboardLegend'
import CheckboardPlus from './components/checkboard/CheckboardPlus'
import CheckboardPropertyDrawer from './components/checkboard/CheckboardPropertyDrawer'
import ComplexAboutTab from './components/checkboard/ComplexAboutTab'
import ObjectsSearchForm from './components/ObjectsSearchForm'
import {
    createEmptyObjectsSearchFilters,
    hasActiveObjectsSearchFilters,
    parseObjectsSearchFilters,
    preserveObjectsCatalogTab,
    serializeObjectsSearchFilters,
    withoutComplexFilters,
} from './filtersQuery'

const { TabList, TabNav, TabContent } = Tabs

const CHECKBOARD_ZOOM_MIN = 0.3
const CHECKBOARD_ZOOM_MAX = 1.5
const CHECKBOARD_ZOOM_STEP = 0.1
const CHECKBOARD_ZOOM_STORAGE_KEY = 'objects.checkboard.zoom'

const clampCheckboardZoom = (value: number) =>
    Math.round(
        Math.min(CHECKBOARD_ZOOM_MAX, Math.max(CHECKBOARD_ZOOM_MIN, value)) *
            10,
    ) / 10

const readStoredCheckboardZoom = () => {
    try {
        const raw = localStorage.getItem(CHECKBOARD_ZOOM_STORAGE_KEY)
        if (raw == null) return 1
        const parsed = Number(raw)
        if (!Number.isFinite(parsed)) return 1
        return clampCheckboardZoom(parsed)
    } catch {
        return 1
    }
}

const writeStoredCheckboardZoom = (value: number) => {
    try {
        localStorage.setItem(
            CHECKBOARD_ZOOM_STORAGE_KEY,
            String(clampCheckboardZoom(value)),
        )
    } catch {
        // ignore quota / private mode errors
    }
}

const syncSearchStateInUrl = (
    filters: ObjectsSearchFilters,
    propertyId: number | null,
) => {
    const url = new URL(window.location.href)
    const params = serializeObjectsSearchFilters(filters)

    if (propertyId != null) {
        params.set('property_id', String(propertyId))
    }

    preserveObjectsCatalogTab(params, url.search)

    url.search = params.toString()
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState(window.history.state, '', next)
}

const ComplexCheckboard = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const initialFilters = useMemo(() => createEmptyObjectsSearchFilters(), [])
    const [view, setView] = useState('classic')
    const [labelMode, setLabelMode] = useState<CheckboardCellLabel>('rooms')
    const [zoom, setZoom] = useState(readStoredCheckboardZoom)
    const [draftFilters, setDraftFilters] =
        useState<ObjectsSearchFilters>(initialFilters)
    const [appliedFilters, setAppliedFilters] =
        useState<ObjectsSearchFilters>(initialFilters)
    const [activeStatusCodes, setActiveStatusCodes] = useState<string[]>([])
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
        null,
    )
    const [detailsPanelOpen, setDetailsPanelOpen] = useState(false)
    const [data, setData] = useState<CheckboardBuilding | null | undefined>()
    const [isLoading, setIsLoading] = useState(Boolean(id))
    const [complexInfo, setComplexInfo] = useState<Complex | null | undefined>()
    const [isComplexInfoLoading, setIsComplexInfoLoading] = useState(
        Boolean(id),
    )
    const [propertyDetails, setPropertyDetails] = useState<
        Premise | null | undefined
    >()
    const [isPropertyDetailsLoading, setIsPropertyDetailsLoading] =
        useState(false)

    useEffect(() => {
        writeStoredCheckboardZoom(zoom)
    }, [zoom])

    useEffect(() => {
        if (!id) {
            setData(undefined)
            setIsLoading(false)
            return
        }

        let cancelled = false
        setIsLoading(true)
        setActiveStatusCodes([])

        void apiGetCheckboard(id)
            .then((result) => {
                if (cancelled) return
                setData(result)
                if (result) {
                    setActiveStatusCodes(
                        getDefaultActiveStatusCodes(collectStatuses(result)),
                    )
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [id])

    useEffect(() => {
        if (!id) {
            setComplexInfo(undefined)
            setIsComplexInfoLoading(false)
            return
        }

        let cancelled = false
        setIsComplexInfoLoading(true)

        void apiGetRealtyObject(id)
            .then((result) => {
                if (!cancelled) setComplexInfo(result)
            })
            .finally(() => {
                if (!cancelled) setIsComplexInfoLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [id])

    useEffect(() => {
        if (selectedPropertyId == null) {
            setPropertyDetails(undefined)
            setIsPropertyDetailsLoading(false)
            return
        }

        let cancelled = false
        setIsPropertyDetailsLoading(true)

        void apiGetRealtyProperty(selectedPropertyId)
            .then((result) => {
                if (!cancelled) setPropertyDetails(result)
            })
            .finally(() => {
                if (!cancelled) setIsPropertyDetailsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [selectedPropertyId])

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

        const nextFilters = withoutComplexFilters(
            parseObjectsSearchFilters(window.location.search),
        )
        setDraftFilters(nextFilters)
        setAppliedFilters(nextFilters)

        const param = new URLSearchParams(window.location.search).get(
            'property_id',
        )
        if (!param) return

        const parsed = Number(param)
        if (!Number.isFinite(parsed)) return

        const property = findBuildingPropertyById(data, parsed)
        if (property) {
            setSelectedPropertyId(property.id)
            setDetailsPanelOpen(true)
        }
    }, [data, id])

    const currentComplex = useMemo((): Complex | null => {
        if (complexInfo) return complexInfo
        if (!data || !id) return null

        return { id, name: data.name }
    }, [complexInfo, data, id])

    const allProperties = useMemo(
        () => (data ? flattenBuildingProperties(data) : []),
        [data],
    )

    const hasSearchFilters = hasActiveObjectsSearchFilters(appliedFilters)

    const matchingPropertyIds = useMemo(() => {
        if (!hasSearchFilters) return null

        return new Set(
            allProperties
                .filter((property) =>
                    matchesObjectsSearchFilters(property, appliedFilters),
                )
                .map((property) => property.id),
        )
    }, [allProperties, appliedFilters, hasSearchFilters])

    const activePropertyIds = useMemo(() => {
        if (!data) return null

        if (!hasSearchFilters && activeStatusCodes.length === 0) {
            return null
        }

        const activeStatusSet =
            activeStatusCodes.length > 0
                ? new Set(activeStatusCodes)
                : null

        const visible = new Set<number>()

        allProperties.forEach((property) => {
            if (
                hasSearchFilters &&
                matchingPropertyIds &&
                !matchingPropertyIds.has(property.id)
            ) {
                return
            }
            if (
                activeStatusSet &&
                !activeStatusSet.has(property.status.code)
            ) {
                return
            }
            visible.add(property.id)
        })

        return visible
    }, [
        activeStatusCodes,
        allProperties,
        data,
        hasSearchFilters,
        matchingPropertyIds,
    ])

    const stats = useMemo(() => {
        if (!data) {
            return { total: 0 }
        }

        if (!activePropertyIds) {
            return {
                total: allProperties.length,
            }
        }

        let total = 0

        allProperties.forEach((property) => {
            if (!activePropertyIds.has(property.id)) return
            total += 1
        })

        return { total }
    }, [activePropertyIds, allProperties, data])

    const statuses = useMemo(() => (data ? collectStatuses(data) : []), [data])

    const handleApplyFilters = () => {
        const nextFilters = withoutComplexFilters(draftFilters)

        setDraftFilters(nextFilters)
        setAppliedFilters(nextFilters)
        syncSearchStateInUrl(nextFilters, selectedPropertyId)
    }

    const handleDraftFiltersChange = (nextFilters: ObjectsSearchFilters) => {
        const normalized = withoutComplexFilters(nextFilters)
        setDraftFilters(normalized)

        if (!hasActiveObjectsSearchFilters(normalized)) {
            const empty = createEmptyObjectsSearchFilters()
            setAppliedFilters(empty)
            syncSearchStateInUrl(empty, selectedPropertyId)
            return
        }

        if (hasActiveObjectsSearchFilters(appliedFilters)) {
            setAppliedFilters(normalized)
            syncSearchStateInUrl(normalized, selectedPropertyId)
        }
    }

    const handleResetFilters = () => {
        const nextFilters = createEmptyObjectsSearchFilters()

        setDraftFilters(nextFilters)
        setAppliedFilters(nextFilters)
        syncSearchStateInUrl(nextFilters, selectedPropertyId)
    }

    const handleStatusClick = (code: string) => {
        setActiveStatusCodes((prev) =>
            prev.includes(code)
                ? prev.filter((item) => item !== code)
                : [...prev, code],
        )
        if (view === 'about') {
            setView('classic')
        }
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
                                            preserveObjectsCatalogTab(
                                                params,
                                                window.location.search,
                                            )
                                            const query = params.toString()
                                            navigate(
                                                query
                                                    ? `/objects?${query}`
                                                    : '/objects',
                                            )
                                        }}
                                    >
                                        К списку домов
                                    </Button>

                                    <h3 className="mb-1">{data.name}</h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Шахматка помещений по секциям
                                    </p>
                                </div>
                            </div>

                            <ObjectsSearchForm
                                filters={draftFilters}
                                isSearching={false}
                                hasAppliedFilters={hasActiveObjectsSearchFilters(
                                    appliedFilters,
                                )}
                                desktopActionsInGrid
                                onCollapsedChange={() => {}}
                                onChange={handleDraftFiltersChange}
                                onSearch={handleApplyFilters}
                                onReset={handleResetFilters}
                            />

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                                    Всего:{' '}
                                    <span className="ml-1 text-base tabular-nums">
                                        {stats.total}
                                    </span>
                                </span>
                            </div>

                            <CheckboardLegend
                                statuses={statuses}
                                activeStatusCodes={activeStatusCodes}
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

                                        <TabNav
                                            value="about"
                                            className="!px-2.5 sm:!px-5 text-center"
                                        >
                                            О Жилом комплексе
                                        </TabNav>
                                    </TabList>

                                    {view !== 'about' ? (
                                        <div className="flex flex-wrap items-center gap-3">
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
                                                                labelMode ===
                                                                    item.value
                                                                    ? 'bg-primary text-neutral'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200',
                                                            )}
                                                            onClick={() =>
                                                                setLabelMode(
                                                                    item.value,
                                                                )
                                                            }
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}

                                            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800/60">
                                                <button
                                                    type="button"
                                                    title="Уменьшить"
                                                    disabled={
                                                        zoom <=
                                                        CHECKBOARD_ZOOM_MIN
                                                    }
                                                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                                    onClick={() =>
                                                        setZoom((value) =>
                                                            clampCheckboardZoom(
                                                                value -
                                                                    CHECKBOARD_ZOOM_STEP,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <TbZoomOut className="text-lg" />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Сбросить масштаб"
                                                    className="min-w-14 rounded-md px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-gray-700 transition-colors hover:bg-white dark:text-gray-200 dark:hover:bg-gray-700"
                                                    onClick={() => setZoom(1)}
                                                >
                                                    {Math.round(zoom * 100)}%
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Увеличить"
                                                    disabled={
                                                        zoom >=
                                                        CHECKBOARD_ZOOM_MAX
                                                    }
                                                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                                    onClick={() =>
                                                        setZoom((value) =>
                                                            clampCheckboardZoom(
                                                                value +
                                                                    CHECKBOARD_ZOOM_STEP,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <TbZoomIn className="text-lg" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="mt-5">
                                    <TabContent value="classic">
                                        <CheckboardClassic
                                            building={data}
                                            labelMode={labelMode}
                                            activePropertyIds={
                                                activePropertyIds
                                            }
                                            selectedPropertyId={
                                                selectedPropertyId
                                            }
                                            zoom={zoom}
                                            onZoomChange={setZoom}
                                            onPropertySelect={
                                                handlePropertySelect
                                            }
                                        />
                                    </TabContent>

                                    <TabContent value="plus">
                                        <CheckboardPlus
                                            building={data}
                                            activePropertyIds={
                                                activePropertyIds
                                            }
                                            selectedPropertyId={
                                                selectedPropertyId
                                            }
                                            zoom={zoom}
                                            onZoomChange={setZoom}
                                            onPropertySelect={
                                                handlePropertySelect
                                            }
                                        />
                                    </TabContent>

                                    <TabContent value="about">
                                        <ComplexAboutTab
                                            complex={currentComplex}
                                            fallbackName={data.name}
                                            isLoading={isComplexInfoLoading}
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
                propertyDetails={propertyDetails ?? null}
                isDetailsLoading={isPropertyDetailsLoading}
                complexId={id}
                complexName={data?.name}
                onClose={handleCloseDrawer}
            />
        </Container>
    )
}

export default ComplexCheckboard
