import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { components } from 'react-select'
import type { MenuListProps, GroupBase } from 'react-select'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import {
    AGENCY_SUPERVISOR,
    SUPERVISOR,
    ADMIN,
} from '@/constants/roles.constant'
import { apiGetAgencies, apiGetAgency } from '@/services/AgencyService'
import { useSessionUser } from '@/store/authStore'
import type { AgencyAgent, AgencyItem } from '@/@types/agency'

type Option = {
    value: number
    label: string
}

type AgencySelectProps = {
    isLoadingMore?: boolean
}

type DashboardAnalyticsFiltersProps = {
    selectedAgencyId: number | null
    selectedAgentId: number | null
    onAgencyChange: (agencyId: number | null) => void
    onAgentChange: (agentId: number | null) => void
}

const AGENCIES_PER_PAGE = 20

const formatAgentLabel = (agent: AgencyAgent) => {
    const name = agent.name?.trim() || 'Без имени'
    const phone = agent.phone?.trim()
    return phone ? `${name} (${phone})` : name
}

const mergeAgencies = (prev: AgencyItem[], next: AgencyItem[]) => {
    if (next.length === 0) return prev
    const seen = new Set(prev.map((item) => item.id))
    const uniqueNext = next.filter((item) => !seen.has(item.id))
    return uniqueNext.length > 0 ? [...prev, ...uniqueNext] : prev
}

const AgencyMenuList = (
    props: MenuListProps<Option, false, GroupBase<Option>>,
) => {
    const isLoadingMore = Boolean(
        (props.selectProps as AgencySelectProps).isLoadingMore,
    )

    return (
        <>
            <components.MenuList {...props} />
            {isLoadingMore ? (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400">
                    <Spinner size={14} />
                    Загрузка...
                </div>
            ) : null}
        </>
    )
}

export const getDashboardAnalyticsScope = (authority: string[] = []) => {
    const isSupervisor =
        authority.includes(SUPERVISOR) || authority.includes(ADMIN)
    const isAgencySupervisor =
        authority.includes(AGENCY_SUPERVISOR) && !isSupervisor

    return {
        isSupervisor,
        isAgencySupervisor,
        canSelectAgency: isSupervisor,
        canSelectAgent: isSupervisor || isAgencySupervisor,
    }
}

const DashboardAnalyticsFilters = ({
    selectedAgencyId,
    selectedAgentId,
    onAgencyChange,
    onAgentChange,
}: DashboardAnalyticsFiltersProps) => {
    const user = useSessionUser((state) => state.user)
    const authority = user.authority ?? []
    const scope = useMemo(
        () => getDashboardAnalyticsScope(authority),
        [authority],
    )

    const [agencies, setAgencies] = useState<AgencyItem[]>([])
    const [selectedAgency, setSelectedAgency] = useState<AgencyItem | null>(
        null,
    )
    const [agents, setAgents] = useState<AgencyAgent[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const pageRef = useRef(1)
    const hasMoreRef = useRef(false)
    const loadingMoreRef = useRef(false)
    const searchRef = useRef('')
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!scope.canSelectAgent || scope.isSupervisor) return

        let cancelled = false

        const load = async () => {
            setIsLoading(true)
            try {
                const agencyId = user.agency?.id
                if (!agencyId) {
                    if (!cancelled) {
                        setSelectedAgency(null)
                        setAgents([])
                    }
                    return
                }

                const agency = await apiGetAgency(agencyId, { with: 'agents' })
                if (cancelled) return

                setSelectedAgency(agency)
                setAgents(agency?.agents ?? [])
            } catch {
                if (!cancelled) {
                    setSelectedAgency(null)
                    setAgents([])
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        void load()

        return () => {
            cancelled = true
        }
    }, [scope.canSelectAgent, scope.isSupervisor, user.agency?.id])

    useEffect(() => {
        if (!scope.isSupervisor) return

        let cancelled = false
        searchRef.current = searchQuery

        const fetchFirstPage = async () => {
            setIsLoading(true)
            try {
                const response = await apiGetAgencies({
                    page: 1,
                    per_page: AGENCIES_PER_PAGE,
                    with: 'agents',
                    search: searchQuery || undefined,
                })
                if (cancelled) return

                const list = response.data ?? []
                const currentPage = response.meta?.current_page ?? 1
                const lastPage = response.meta?.last_page ?? 1
                const more = currentPage < lastPage

                setAgencies(list)
                pageRef.current = currentPage
                hasMoreRef.current = more
            } catch {
                if (!cancelled) {
                    setAgencies([])
                    hasMoreRef.current = false
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        void fetchFirstPage()

        return () => {
            cancelled = true
        }
    }, [scope.isSupervisor, searchQuery])

    useEffect(() => {
        if (!scope.isSupervisor) return

        if (selectedAgencyId == null) {
            setSelectedAgency(null)
            setAgents([])
            return
        }

        const fromList = agencies.find((item) => item.id === selectedAgencyId)
        if (fromList) {
            setSelectedAgency(fromList)
            setAgents(fromList.agents ?? [])
            return
        }

        if (selectedAgency?.id === selectedAgencyId) {
            setAgents(selectedAgency.agents ?? [])
        }
    }, [agencies, scope.isSupervisor, selectedAgency, selectedAgencyId])

    useEffect(() => {
        if (!scope.canSelectAgent) return
        if (agents.length === 0) {
            if (selectedAgentId != null) onAgentChange(null)
            return
        }

        const hasSelected = agents.some((agent) => agent.id === selectedAgentId)
        if (!hasSelected) {
            onAgentChange(agents[0].id)
        }
    }, [agents, onAgentChange, scope.canSelectAgent, selectedAgentId])

    const handleSearchInputChange = (value: string) => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current)
        }
        searchTimerRef.current = setTimeout(() => {
            searchTimerRef.current = null
            const trimmed = value.trim()
            if (trimmed !== searchRef.current) {
                searchRef.current = trimmed
                setSearchQuery(trimmed)
            }
        }, 500)
    }

    const handleMenuScrollToBottom = useCallback(async () => {
        if (
            !scope.isSupervisor ||
            loadingMoreRef.current ||
            !hasMoreRef.current ||
            isLoading
        ) {
            return
        }

        loadingMoreRef.current = true
        setIsLoadingMore(true)

        const queryAtStart = searchRef.current
        const nextPage = pageRef.current + 1

        try {
            const response = await apiGetAgencies({
                page: nextPage,
                per_page: AGENCIES_PER_PAGE,
                with: 'agents',
                search: queryAtStart || undefined,
            })

            if (searchRef.current !== queryAtStart) return

            const list = response.data ?? []
            const currentPage = response.meta?.current_page ?? nextPage
            const lastPage = response.meta?.last_page ?? nextPage
            const more = currentPage < lastPage

            setAgencies((prev) => mergeAgencies(prev, list))
            pageRef.current = currentPage
            hasMoreRef.current = more
        } finally {
            loadingMoreRef.current = false
            setIsLoadingMore(false)
        }
    }, [isLoading, scope.isSupervisor])

    useEffect(() => {
        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current)
            }
        }
    }, [])

    if (!scope.canSelectAgent) {
        return null
    }

    const agencyOptions: Option[] = agencies.map((agency) => ({
        value: agency.id,
        label: agency.name,
    }))

    const selectedAgencyOption =
        selectedAgency != null
            ? { value: selectedAgency.id, label: selectedAgency.name }
            : null

    const agencyOptionsWithSelected =
        selectedAgencyOption &&
        !agencyOptions.some((item) => item.value === selectedAgencyOption.value)
            ? [selectedAgencyOption, ...agencyOptions]
            : agencyOptions

    const agentOptions: Option[] = agents.map((agent) => ({
        value: agent.id,
        label: formatAgentLabel(agent),
    }))

    const selectedAgentOption =
        agentOptions.find((item) => item.value === selectedAgentId) ?? null

    return (
        <div
            className={
                scope.canSelectAgency
                    ? 'grid w-full grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2'
                    : 'w-full sm:ml-auto sm:w-80'
            }
        >
            {scope.canSelectAgency ? (
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        Агентство
                    </label>
                    <Select
                        isSearchable
                        isClearable
                        isLoading={isLoading || isLoadingMore}
                        options={agencyOptionsWithSelected}
                        value={selectedAgencyOption}
                        placeholder="Выберите агентство"
                        filterOption={() => true}
                        noOptionsMessage={() => 'Агентства не найдены'}
                        components={{ MenuList: AgencyMenuList }}
                        onInputChange={(value, meta) => {
                            if (meta.action === 'input-change') {
                                handleSearchInputChange(value)
                            }
                        }}
                        onMenuScrollToBottom={() => {
                            void handleMenuScrollToBottom()
                        }}
                        onChange={(option) => {
                            const nextId = option?.value
                                ? Number(option.value)
                                : null
                            const agency =
                                agencies.find((item) => item.id === nextId) ??
                                null
                            setSelectedAgency(agency)
                            setAgents(agency?.agents ?? [])
                            onAgencyChange(nextId)
                            onAgentChange(null)
                        }}
                        {...({ isLoadingMore } satisfies AgencySelectProps)}
                    />
                </div>
            ) : null}
            <div>
                <label className="mb-1.5 block text-sm font-medium">
                    Агент
                </label>
                <Select
                    isSearchable
                    isLoading={isLoading}
                    isDisabled={scope.canSelectAgency && !selectedAgencyId}
                    options={agentOptions}
                    value={selectedAgentOption}
                    placeholder="Выберите агента"
                    onChange={(option) => {
                        const nextId = option?.value
                            ? Number(option.value)
                            : null
                        onAgentChange(nextId)
                    }}
                />
            </div>
        </div>
    )
}

export default DashboardAnalyticsFilters
