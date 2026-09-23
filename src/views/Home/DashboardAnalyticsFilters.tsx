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

type AgentOption = {
    value: number | null
    label: string
}

type AgencySelectProps = {
    isLoadingMore?: boolean
}

export type DashboardAgencyAgentsState = {
    agencyId: number
    agentIds: number[]
    status: 'loading' | 'ready' | 'error'
}

type DashboardAnalyticsFiltersProps = {
    selectedAgencyId: number | null
    selectedAgentId: number | null
    onAgencyChange: (agencyId: number | null) => void
    onAgentChange: (agentId: number | null) => void
    onAgencyAgentsChange: (state: DashboardAgencyAgentsState | null) => void
}

const AGENCIES_PER_PAGE = 20
const ALL_AGENTS_OPTION: AgentOption = {
    value: null,
    label: 'Все агенты',
}

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
    onAgencyAgentsChange,
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
    const [isAgentsLoading, setIsAgentsLoading] = useState(false)
    const [agentsLoadFailed, setAgentsLoadFailed] = useState(false)
    const [agentsReloadKey, setAgentsReloadKey] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [searchReloadKey, setSearchReloadKey] = useState(0)
    const [lastSelectedAgencyOption, setLastSelectedAgencyOption] =
        useState<Option | null>(null)

    const pageRef = useRef(1)
    const hasMoreRef = useRef(false)
    const loadingMoreRef = useRef(false)
    const searchRef = useRef('')
    const searchVersionRef = useRef(0)
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        setSelectedAgency(null)
        setAgents([])
        setAgentsLoadFailed(false)

        if (!scope.canSelectAgent || selectedAgencyId == null) {
            setIsAgentsLoading(false)
            onAgencyAgentsChange(null)
            return
        }

        let cancelled = false
        setIsAgentsLoading(true)
        onAgencyAgentsChange({
            agencyId: selectedAgencyId,
            agentIds: [],
            status: 'loading',
        })

        const load = async () => {
            try {
                const agency = await apiGetAgency(selectedAgencyId, {
                    with: 'agents',
                })
                if (cancelled) return

                // Не подменяем ошибку загрузки пустым списком или общей статистикой.
                if (
                    !agency ||
                    agency.id !== selectedAgencyId ||
                    !Array.isArray(agency.agents)
                ) {
                    throw new Error('Agency agents are unavailable')
                }

                const agencyAgents = Array.from(
                    new Map(
                        agency.agents
                            .filter(
                                (agent) =>
                                    Number.isFinite(agent.id) && agent.id > 0,
                            )
                            .map((agent) => [agent.id, agent] as const),
                    ).values(),
                )
                setSelectedAgency(agency)
                setAgents(agencyAgents)
                onAgencyAgentsChange({
                    agencyId: selectedAgencyId,
                    agentIds: [...new Set(agencyAgents.map((agent) => agent.id))],
                    status: 'ready',
                })
            } catch {
                if (!cancelled) {
                    setAgentsLoadFailed(true)
                    onAgencyAgentsChange({
                        agencyId: selectedAgencyId,
                        agentIds: [],
                        status: 'error',
                    })
                }
            } finally {
                if (!cancelled) setIsAgentsLoading(false)
            }
        }

        void load()

        return () => {
            cancelled = true
        }
    }, [
        scope.canSelectAgent,
        selectedAgencyId,
        agentsReloadKey,
        onAgencyAgentsChange,
    ])

    useEffect(() => {
        if (!scope.isSupervisor) return

        let cancelled = false
        const requestVersion = searchVersionRef.current
        const isCurrentRequest = () =>
            !cancelled && requestVersion === searchVersionRef.current

        pageRef.current = 1
        hasMoreRef.current = false

        const fetchFirstPage = async () => {
            setIsLoading(true)
            try {
                const response = await apiGetAgencies({
                    page: 1,
                    per_page: AGENCIES_PER_PAGE,
                    search: searchQuery || undefined,
                })
                if (!isCurrentRequest()) return

                const list = response.data ?? []
                const currentPage = response.meta?.current_page ?? 1
                const lastPage = response.meta?.last_page ?? 1
                const more = currentPage < lastPage

                setAgencies(list)
                pageRef.current = currentPage
                hasMoreRef.current = more
            } catch {
                if (isCurrentRequest()) {
                    setAgencies([])
                    hasMoreRef.current = false
                }
            } finally {
                if (isCurrentRequest()) setIsLoading(false)
            }
        }

        void fetchFirstPage()

        return () => {
            cancelled = true
        }
    }, [scope.isSupervisor, searchQuery, searchReloadKey])

    useEffect(() => {
        if (
            !scope.canSelectAgent ||
            isAgentsLoading ||
            selectedAgency?.id !== selectedAgencyId ||
            selectedAgentId == null
        ) {
            return
        }

        // null означает всё агентство. Первый агент больше не выбирается автоматически.
        if (!agents.some((agent) => agent.id === selectedAgentId)) {
            onAgentChange(null)
        }
    }, [
        agents,
        isAgentsLoading,
        onAgentChange,
        scope.canSelectAgent,
        selectedAgency,
        selectedAgencyId,
        selectedAgentId,
    ])

    const handleSearchInputChange = (value: string, forceReload = false) => {
        setSearchInput(value)
        const trimmed = value.trim()
        if (trimmed === searchRef.current && !forceReload) return

        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current)
            searchTimerRef.current = null
        }

        searchRef.current = trimmed
        // Ответы прежнего поиска и его пагинации больше не должны менять список.
        searchVersionRef.current += 1
        pageRef.current = 1
        hasMoreRef.current = false
        loadingMoreRef.current = false
        setIsLoadingMore(false)
        setIsLoading(true)

        const applySearch = () => {
            searchTimerRef.current = null
            setSearchQuery(trimmed)
            setSearchReloadKey((key) => key + 1)
        }

        if (!trimmed) {
            // Очистка (в том числе после выбора) сразу возвращает первую страницу
            // без search; debounce нужен только при вводе непустого названия.
            applySearch()
            return
        }

        searchTimerRef.current = setTimeout(applySearch, 500)
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
        const requestVersion = searchVersionRef.current
        const nextPage = pageRef.current + 1

        try {
            const response = await apiGetAgencies({
                page: nextPage,
                per_page: AGENCIES_PER_PAGE,
                search: queryAtStart || undefined,
            })

            if (requestVersion !== searchVersionRef.current) return

            const list = response.data ?? []
            const currentPage = response.meta?.current_page ?? nextPage
            const lastPage = response.meta?.last_page ?? nextPage
            const more = currentPage < lastPage

            setAgencies((prev) => mergeAgencies(prev, list))
            pageRef.current = currentPage
            hasMoreRef.current = more
        } catch {
            // Сохраняем уже загруженные варианты; прокрутка позволяет повторить запрос.
        } finally {
            if (requestVersion === searchVersionRef.current) {
                loadingMoreRef.current = false
                setIsLoadingMore(false)
            }
        }
    }, [isLoading, scope.isSupervisor])

    useEffect(() => {
        return () => {
            searchVersionRef.current += 1
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

    const currentAgency =
        selectedAgency?.id === selectedAgencyId
            ? selectedAgency
            : agencies.find((agency) => agency.id === selectedAgencyId)

    const selectedAgencyOption = currentAgency
        ? { value: currentAgency.id, label: currentAgency.name }
        : lastSelectedAgencyOption?.value === selectedAgencyId
          ? lastSelectedAgencyOption
          : null

    const agencyOptionsWithSelected =
        selectedAgencyOption &&
        !agencyOptions.some((item) => item.value === selectedAgencyOption.value)
            ? [selectedAgencyOption, ...agencyOptions]
            : agencyOptions

    const agentOptions: AgentOption[] = [
        ALL_AGENTS_OPTION,
        ...agents.map((agent) => ({
            value: agent.id,
            label: formatAgentLabel(agent),
        })),
    ]

    const hasLoadedAgency =
        selectedAgencyId != null && selectedAgency?.id === selectedAgencyId
    const selectedAgentOption = hasLoadedAgency
        ? (agentOptions.find((item) => item.value === selectedAgentId) ??
          ALL_AGENTS_OPTION)
        : null

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
                    <label
                        htmlFor="dashboard-agency-filter"
                        className="mb-1.5 block text-sm font-medium"
                    >
                        Агентство
                    </label>
                    <Select<Option>
                        inputId="dashboard-agency-filter"
                        isSearchable
                        isClearable
                        isLoading={isLoading || isLoadingMore}
                        options={agencyOptionsWithSelected}
                        value={selectedAgencyOption}
                        inputValue={searchInput}
                        placeholder="Выберите агентство"
                        filterOption={() => true}
                        noOptionsMessage={() => 'Агентства не найдены'}
                        components={{ MenuList: AgencyMenuList }}
                        onInputChange={(value, meta) => {
                            if (meta.action === 'input-change' || value === '') {
                                handleSearchInputChange(value)
                            }
                        }}
                        onMenuScrollToBottom={() => {
                            void handleMenuScrollToBottom()
                        }}
                        onChange={(option) => {
                            setLastSelectedAgencyOption(option ?? null)
                            onAgencyChange(option?.value ?? null)
                            onAgentChange(null)
                            if (!option) {
                                // Крестик, Delete и Backspace могут сбросить выбор
                                // без события input-change.
                                handleSearchInputChange('', true)
                            }
                        }}
                        {...({ isLoadingMore } satisfies AgencySelectProps)}
                    />
                </div>
            ) : null}
            <div>
                <label
                    htmlFor="dashboard-agent-filter"
                    className="mb-1.5 block text-sm font-medium"
                >
                    Агент
                </label>
                <Select<AgentOption>
                    inputId="dashboard-agent-filter"
                    isSearchable
                    isClearable
                    isLoading={isAgentsLoading}
                    isDisabled={!hasLoadedAgency || isAgentsLoading}
                    options={agentOptions}
                    value={selectedAgentOption}
                    getOptionValue={(option) =>
                        option.value == null ? 'all-agents' : String(option.value)
                    }
                    placeholder={
                        isAgentsLoading ? 'Загрузка агентов...' : 'Все агенты'
                    }
                    noOptionsMessage={() => 'Агенты не найдены'}
                    onChange={(option) => {
                        onAgentChange(option?.value ?? null)
                    }}
                />
                {agentsLoadFailed ? (
                    <button
                        type="button"
                        className="mt-1.5 text-sm text-primary hover:underline"
                        onClick={() => setAgentsReloadKey((key) => key + 1)}
                    >
                        Повторить загрузку агентов
                    </button>
                ) : null}
            </div>
        </div>
    )
}

export default DashboardAnalyticsFilters
