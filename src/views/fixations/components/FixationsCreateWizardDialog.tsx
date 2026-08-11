import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import classNames from '@/utils/classNames'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Steps from '@/components/ui/Steps'
import Table from '@/components/ui/Table'
import Input from '@/components/ui/Input'
import Select, { Option as SelectMenuOption } from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import CloseButton from '@/components/ui/CloseButton'
import AsyncSelect from 'react-select/async'
import DatePicker from '@/components/ui/DatePicker'
import { Form, FormItem } from '@/components/ui/Form'
import PhoneInput from '@/components/shared/PhoneInput'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiCreateFixation,
    apiCreateFixationClient,
    apiGetFixationClients,
    apiGetFixationComplexes,
} from '@/services/FixationsService'
import { apiGetCheckboard } from '@/services/ObjectsService'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import useSWR, { useSWRConfig } from 'swr'
import { z } from 'zod'
import 'dayjs/locale/ru'
import debounce from 'lodash/debounce'
import { HiChevronDown } from 'react-icons/hi'
import {
    TbArrowLeft,
    TbArrowsMaximize,
    TbBuilding,
    TbCheck,
    TbHome,
    TbMessage,
    TbNote,
    TbPlus,
    TbTrash,
    TbUser,
    TbUsers,
} from 'react-icons/tb'
import CheckboardClassic from '@/views/objects/components/checkboard/CheckboardClassic'
import { findBuildingPropertyById } from '@/views/objects/checkboardUtils'
import type { CheckboardCellLabel } from '@/views/objects/checkboard.types'
import type {
    FixationApartment,
    FixationClient,
    FixationComplex,
    FixationCreateInitialSelection,
    FixationManager,
} from '../createWizard.types'
import {
    formatFixationKinship,
    fixationKinshipOptions,
    normalizeRuPhoneDigits,
    RU_PHONE_REGEX,
} from '../utils'

const { THead, TBody, Tr, Th, Td } = Table

type WizardStep = 'client' | 'client-create' | 'complex' | 'note' | 'confirm'

type SelectedRelative = {
    client: FixationClient
    relation: string
}

type ManagerSelection = FixationManager | 'any'

type FixationsCreateWizardDialogProps = {
    isOpen: boolean
    initialSelection?: FixationCreateInitialSelection | null
    onClose: () => void
}

type ClientCreateSchema = {
    lastName: string
    firstName: string
    middleName?: string
    phone: string
}

type SelectOption = {
    value: string
    label: string
}

type ClientSelectOption = SelectOption & {
    client: FixationClient
}

const CLIENTS_PAGE_SIZES = [20, 50, 100]
const ANY_MANAGER_VALUE = 'any'

const STEP_INDEX: Record<Exclude<WizardStep, 'client-create'>, number> = {
    client: 0,
    complex: 1,
    note: 2,
    confirm: 3,
}

const STEP_BY_INDEX: Record<number, Exclude<WizardStep, 'client-create'>> = {
    0: 'client',
    1: 'complex',
    2: 'note',
    3: 'confirm',
}

const STEP_META: Record<
    Exclude<WizardStep, 'client-create'>,
    { title: string; description: string }
> = {
    client: {
        title: 'Клиент',
        description: 'Выберите клиента из списка или создайте нового',
    },
    complex: {
        title: 'ЖК и менеджер',
        description:
            'Выберите жилой комплекс, квартиру на шахматке и менеджера',
    },
    note: {
        title: 'Предпочтения',
        description: 'Добавьте пожелания к фиксации при необходимости',
    },
    confirm: {
        title: 'Подтверждение',
        description: 'Проверьте данные перед созданием фиксации',
    },
}

const SELECTED_ROW_CLASS =
    'border-l-2 border-l-primary bg-primary/10 dark:bg-primary/15'

const formatYMD = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
    )}-${String(date.getDate()).padStart(2, '0')}`

const formatYMDToDMY = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if (!match) return value
    const [, y, m, d] = match
    return `${d}.${m}.${y}`
}

const formatBudgetValue = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''

    return new Intl.NumberFormat('ru-RU').format(Number(digits))
}

const SELECT_MENU_CLOSE_SCROLL_PX = 56

const selectMenuProps = {
    menuPortalTarget:
        typeof document !== 'undefined' ? document.body : undefined,
    menuPosition: 'fixed' as const,
    closeMenuOnScroll: false,
    styles: {
        menuPortal: (base: Record<string, unknown>) => ({
            ...base,
            zIndex: 60,
        }),
    },
}

const isSelectControlFocused = () => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return false

    return (
        active.getAttribute('role') === 'combobox' ||
        active.closest('.select__control') != null ||
        active.closest('.select-control') != null
    )
}

const closeOpenSelectMenus = () => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return

    if (isSelectControlFocused()) {
        active.blur()
    }
}

const desiredAreaOptions: SelectOption[] = [
    { value: '0-30', label: '0-30' },
    { value: '30-50', label: '30-50' },
    { value: '50-70', label: '50-70' },
    { value: '70-90', label: '70-90' },
    { value: '90+', label: '90+' },
]

const desiredRoomsOptions: SelectOption[] = [
    { value: 'Студия', label: 'Студия' },
    { value: '1 / 1+', label: '1 / 1+' },
    { value: '2 / 2+', label: '2 / 2+' },
    { value: '3 / 3+', label: '3 / 3+' },
    { value: '4 / 4+', label: '4 / 4+' },
    { value: 'Другое', label: 'Другое' },
]

const paymentFormatOptions: SelectOption[] = [
    { value: 'Наличные', label: 'Наличные' },
    { value: 'Ипотека', label: 'Ипотека' },
    { value: 'Рассрочка', label: 'Рассрочка' },
    { value: 'Материнский капитал', label: 'Материнский капитал' },
    { value: 'Сертификаты', label: 'Сертификаты' },
    { value: 'Трейд-ин', label: 'Трейд-ин' },
    { value: 'Неизвестно', label: 'Неизвестно' },
]

const clientCreateSchema = z.object({
    lastName: z.string().min(1, { message: 'Введите фамилию' }),
    firstName: z.string().min(1, { message: 'Введите имя' }),
    middleName: z.string().optional(),
    phone: z
        .string()
        .min(1, { message: 'Введите номер телефона' })
        .regex(RU_PHONE_REGEX, {
            message: 'Введите номер телефона',
        }),
})

const emptyClientForm: ClientCreateSchema = {
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
}

const SummaryCard = ({
    icon,
    label,
    title,
    subtitle,
    isFilled = true,
    scrollableContent = false,
    onEdit,
}: {
    icon: ReactNode
    label: string
    title: string
    subtitle?: string
    isFilled?: boolean
    scrollableContent?: boolean
    onEdit: () => void
}) => (
    <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-primary">
                <span className="text-xl">{icon}</span>
                <p className="text-xs font-semibold uppercase tracking-wider">
                    {label}
                </p>
            </div>
            <span
                className={classNames(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                    isFilled
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                )}
            >
                {isFilled ? <TbCheck className="text-sm" /> : null}
                {isFilled ? 'Указано' : 'Не указано'}
            </span>
        </div>
        <p
            className={classNames(
                'mt-3 text-base font-semibold text-gray-900 dark:text-gray-100',
                scrollableContent &&
                    'max-h-28 overflow-y-auto whitespace-pre-wrap break-words pr-1 text-sm font-medium leading-relaxed',
            )}
        >
            {title}
        </p>
        {subtitle ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
            </p>
        ) : null}
        <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={onEdit}
        >
            Изменить
        </Button>
    </div>
)

const FixationsCreateWizardDialog = ({
    isOpen,
    initialSelection = null,
    onClose,
}: FixationsCreateWizardDialogProps) => {
    const { mutate } = useSWRConfig()
    const [step, setStep] = useState<WizardStep>('client')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCreatingClient, setIsCreatingClient] = useState(false)
    const initialSelectionAppliedRef = useRef(false)
    const selectMenuScrollAnchorRef = useRef<number | null>(null)

    const [clients, setClients] = useState<FixationClient[]>([])
    const [clientsTotal, setClientsTotal] = useState(0)
    const [clientsPageIndex, setClientsPageIndex] = useState(1)
    const [clientsPageSize, setClientsPageSize] = useState(20)
    const [hasClientsLoaded, setHasClientsLoaded] = useState(false)
    const [complexes, setComplexes] = useState<FixationComplex[]>([])
    const [isClientsLoading, setIsClientsLoading] = useState(false)
    const [isComplexesLoading, setIsComplexesLoading] = useState(false)

    const [clientPhoneQuery, setClientPhoneQuery] = useState('')
    const [clientSearchQuery, setClientSearchQuery] = useState('')

    const [selectedClient, setSelectedClient] = useState<FixationClient | null>(
        null,
    )
    const [selectedComplex, setSelectedComplex] =
        useState<FixationComplex | null>(null)
    const [selectedApartment, setSelectedApartment] =
        useState<FixationApartment | null>(null)
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
        null,
    )
    const [isApartmentCheckboardCollapsed, setIsApartmentCheckboardCollapsed] =
        useState(true)
    const [isCheckboardFullscreen, setIsCheckboardFullscreen] = useState(false)
    const [selectedManager, setSelectedManager] =
        useState<ManagerSelection | null>(null)
    const [selectedRelatives, setSelectedRelatives] = useState<
        SelectedRelative[]
    >([])
    const [note, setNote] = useState('')
    const [desiredArea, setDesiredArea] = useState('')
    const [desiredRooms, setDesiredRooms] = useState('')
    const [paymentFormat, setPaymentFormat] = useState('')
    const [budget, setBudget] = useState('')
    const [meetingDate, setMeetingDate] = useState('')

    const {
        control,
        handleSubmit,
        reset: resetClientForm,
        formState: { errors: clientErrors, isValid: isClientFormValid },
    } = useForm<ClientCreateSchema>({
        defaultValues: emptyClientForm,
        resolver: zodResolver(clientCreateSchema),
        mode: 'onChange',
    })

    const resetWizard = () => {
        setStep('client')
        setSelectedClient(null)
        setSelectedComplex(null)
        setSelectedApartment(null)
        setSelectedPropertyId(null)
        setIsApartmentCheckboardCollapsed(true)
        setIsCheckboardFullscreen(false)
        setSelectedManager(null)
        setSelectedRelatives([])
        setNote('')
        setClientPhoneQuery('')
        setClientSearchQuery('')
        setClientsTotal(0)
        setClientsPageIndex(1)
        setClientsPageSize(20)
        setHasClientsLoaded(false)
        setDesiredArea('')
        setDesiredRooms('')
        setPaymentFormat('')
        setBudget('')
        setMeetingDate('')
        resetClientForm(emptyClientForm)
        initialSelectionAppliedRef.current = false
    }

    useEffect(() => {
        if (!isOpen) {
            resetWizard()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    useEffect(() => {
        if (!isOpen || step !== 'client') {
            return
        }

        const timer = window.setTimeout(() => {
            setClientSearchQuery(clientPhoneQuery.trim())
        }, 300)

        return () => {
            window.clearTimeout(timer)
        }
    }, [isOpen, step, clientPhoneQuery])

    useEffect(() => {
        if (!isOpen || step !== 'client') {
            return
        }

        let cancelled = false

        const loadClients = async () => {
            setIsClientsLoading(true)
            try {
                const response = await apiGetFixationClients({
                    q: clientSearchQuery || undefined,
                    page: clientsPageIndex,
                    limit: clientsPageSize,
                })
                if (!cancelled) {
                    setClients(response.list || [])
                    setClientsTotal(response.total || 0)
                    setHasClientsLoaded(true)
                }
            } catch {
                if (!cancelled) {
                    setClients([])
                    setClientsTotal(0)
                    setHasClientsLoaded(true)
                }
            } finally {
                if (!cancelled) {
                    setIsClientsLoading(false)
                }
            }
        }

        void loadClients()

        return () => {
            cancelled = true
        }
    }, [
        isOpen,
        step,
        clientSearchQuery,
        clientsPageIndex,
        clientsPageSize,
    ])

    const clientsPageSizeOptions = useMemo(
        () =>
            CLIENTS_PAGE_SIZES.map((number) => ({
                value: number,
                label: `${number} / стр.`,
            })),
        [],
    )

    const orderedClients = useMemo(() => {
        if (!selectedClient) return clients

        const withoutSelected = clients.filter(
            (client) => client.id !== selectedClient.id,
        )

        return [selectedClient, ...withoutSelected]
    }, [clients, selectedClient])

    const relativeOptionComponents = useMemo(
        () => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Option: (props: any) => (
                <SelectMenuOption
                    {...props}
                    customLabel={(data: ClientSelectOption) => (
                        <div className="ml-2 min-w-0 py-0.5">
                            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                                <span className="truncate text-sm font-medium">
                                    {data.client.fullName}
                                </span>
                                <span className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm sm:text-inherit sm:opacity-80">
                                    {data.client.phone}
                                </span>
                            </div>
                        </div>
                    )}
                />
            ),
        }),
        [],
    )

    useEffect(() => {
        if (
            !isOpen ||
            (step !== 'complex' && !initialSelection?.complexId)
        ) {
            return
        }

        const loadComplexes = async () => {
            setIsComplexesLoading(true)
            try {
                const response = await apiGetFixationComplexes()
                setComplexes(response || [])
            } catch {
                setComplexes([])
            } finally {
                setIsComplexesLoading(false)
            }
        }

        void loadComplexes()
    }, [isOpen, step, initialSelection?.complexId])

    useEffect(() => {
        if (!isOpen || initialSelectionAppliedRef.current) return
        if (!initialSelection?.complexId || complexes.length === 0) return

        const complex =
            complexes.find((item) => item.id === initialSelection.complexId) ||
            null

        if (!complex) {
            initialSelectionAppliedRef.current = true
            return
        }

        const apartmentFromList = initialSelection.propertyId
            ? complex.apartments.find(
                  (apartment) =>
                      apartment.id === String(initialSelection.propertyId),
              )
            : initialSelection.apartmentNumber
              ? complex.apartments.find(
                    (apartment) =>
                        apartment.number === initialSelection.apartmentNumber,
                )
              : undefined

        const apartment: FixationApartment | null =
            apartmentFromList ||
            (initialSelection.apartmentNumber || initialSelection.propertyId
                ? {
                      id: String(
                          initialSelection.propertyId ??
                              initialSelection.apartmentNumber,
                      ),
                      number:
                          initialSelection.apartmentNumber ||
                          String(initialSelection.propertyId),
                      rooms: initialSelection.rooms,
                  }
                : null)

        setSelectedComplex(complex)
        setSelectedApartment(apartment)
        setSelectedPropertyId(initialSelection.propertyId ?? null)
        setSelectedManager('any')
        setIsApartmentCheckboardCollapsed(!apartment)
        initialSelectionAppliedRef.current = true
    }, [complexes, initialSelection, isOpen])

    const complexOptions: SelectOption[] = useMemo(
        () =>
            complexes.map((item) => ({
                value: item.id,
                label: item.name,
            })),
        [complexes],
    )

    const apartmentCheckboardItems = useMemo(() => {
        const apartments = selectedComplex?.apartments ?? []

        return [...apartments].sort((a, b) => {
            const aNum = Number(a.number)
            const bNum = Number(b.number)
            const aIsNum = Number.isFinite(aNum)
            const bIsNum = Number.isFinite(bNum)

            if (aIsNum && bIsNum) return aNum - bNum
            if (aIsNum) return -1
            if (bIsNum) return 1
            return a.number.localeCompare(b.number, 'ru')
        })
    }, [selectedComplex])

    const managerOptions: SelectOption[] = useMemo(
        () => [
            { value: ANY_MANAGER_VALUE, label: 'Любой' },
            ...(selectedComplex?.managers.map((item) => ({
                value: item.id,
                label: item.fullName,
            })) ?? []),
        ],
        [selectedComplex],
    )

    const selectedManagerOption = useMemo(() => {
        if (selectedManager === 'any') {
            return (
                managerOptions.find(
                    (item) => item.value === ANY_MANAGER_VALUE,
                ) || null
            )
        }

        if (selectedManager) {
            return (
                managerOptions.find(
                    (item) => item.value === selectedManager.id,
                ) || null
            )
        }

        return null
    }, [managerOptions, selectedManager])

    const currentStepIndex =
        step === 'client-create' ? STEP_INDEX.client : STEP_INDEX[step]
    const checkboardLabelMode: CheckboardCellLabel = 'number'

    const canGoToStep = (index: number) => {
        if (index === 0) return true
        if (index === 1) return Boolean(selectedClient)
        if (index === 2)
            return Boolean(selectedClient && selectedComplex && selectedManager)
        if (index === 3)
            return Boolean(selectedClient && selectedComplex && selectedManager)
        return false
    }

    const canProceedFromComplex = Boolean(
        selectedComplex && selectedManager,
    )

    const handleStepIndexChange = (index: number) => {
        if (!canGoToStep(index)) return
        setStep(STEP_BY_INDEX[index])
    }

    const handleSelectClient = (client: FixationClient) => {
        setSelectedClient(client)
        setSelectedRelatives((prev) =>
            prev.filter((relative) => relative.client.id !== client.id),
        )
        setStep('complex')
    }

    const handleCreateClient = async (values: ClientCreateSchema) => {
        try {
            setIsCreatingClient(true)
            const client = await apiCreateFixationClient({
                lastName: values.lastName,
                firstName: values.firstName,
                middleName: values.middleName,
                phone: values.phone,
            })
            setSelectedClient(client)
            setClients((prev) => [client, ...prev])
            setSelectedRelatives((prev) =>
                prev.filter((relative) => relative.client.id !== client.id),
            )
            resetClientForm(emptyClientForm)
            setStep('complex')
            toast.push(
                <Notification type="success">
                    Клиент создан и выбран
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Не удалось создать клиента'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsCreatingClient(false)
        }
    }

    const handleComplexChange = (option: SelectOption | null) => {
        const complex =
            complexes.find((item) => item.id === option?.value) || null
        setSelectedComplex(complex)
        setSelectedApartment(null)
        setSelectedPropertyId(null)
        setSelectedManager(complex ? 'any' : null)
        setIsApartmentCheckboardCollapsed(true)
        setIsCheckboardFullscreen(false)
    }

    const shouldLoadCheckboard =
        Boolean(selectedComplex?.id) &&
        (!isApartmentCheckboardCollapsed || isCheckboardFullscreen)

    const { data: selectedComplexCheckboard, isLoading: isCheckboardLoading } =
        useSWR(
            shouldLoadCheckboard
                ? ['/api/objects/checkboard', selectedComplex?.id]
                : null,
            () => apiGetCheckboard(selectedComplex?.id || ''),
            {
                revalidateOnFocus: false,
                revalidateIfStale: false,
                revalidateOnReconnect: false,
            },
        )

    const openCheckboardFullscreen = () => {
        setIsApartmentCheckboardCollapsed(false)
        setIsCheckboardFullscreen(true)
    }

    useEffect(() => {
        if (!selectedComplexCheckboard || !selectedApartment) {
            if (!selectedApartment) setSelectedPropertyId(null)
            return
        }

        const properties = selectedComplexCheckboard.sections.flatMap(
            (section) =>
                Array.isArray(section.properties)
                    ? section.properties
                    : Object.values(section.properties).flat(),
        )

        const matchingProperty =
            properties.find(
                (property) => String(property.id) === selectedApartment.id,
            ) ?? null

        setSelectedPropertyId(matchingProperty?.id ?? null)
    }, [selectedApartment, selectedComplexCheckboard])

    const handleCheckboardPropertySelect = (propertyId: number) => {
        if (!selectedComplexCheckboard) return

        const property = findBuildingPropertyById(
            selectedComplexCheckboard,
            propertyId,
        )
        if (!property) return

        setSelectedPropertyId(propertyId)
        setSelectedApartment({
            id: String(property.id),
            number: property.number,
            rooms: property.rooms_count || undefined,
        })
    }

    const toClientOption = useCallback(
        (client: FixationClient): ClientSelectOption => ({
            value: client.id,
            label: `${client.fullName} · ${client.phone}`,
            client,
        }),
        [],
    )

    const loadRelativeOptions = useMemo(() => {
        const excludedIds = new Set([
            ...(selectedClient ? [selectedClient.id] : []),
            ...selectedRelatives.map((relative) => relative.client.id),
        ])

        const fetchOptions = async (inputValue: string) => {
            const response = await apiGetFixationClients({
                q: inputValue.trim() || undefined,
                page: 1,
                limit: 20,
            })

            return response.list
                .filter((client) => !excludedIds.has(client.id))
                .map(toClientOption)
        }

        return debounce(
            (
                inputValue: string,
                callback: (options: ClientSelectOption[]) => void,
            ) => {
                void fetchOptions(inputValue).then(callback)
            },
            300,
        )
    }, [selectedClient, selectedRelatives, toClientOption])

    useEffect(() => {
        return () => {
            loadRelativeOptions.cancel()
        }
    }, [loadRelativeOptions])

    const kinshipSelectOptions: SelectOption[] = useMemo(
        () =>
            fixationKinshipOptions.map((item) => ({
                value: item.value,
                label: item.label,
            })),
        [],
    )

    const handleAddRelative = (option: ClientSelectOption | null) => {
        if (!option?.client) return

        setSelectedRelatives((prev) => {
            if (prev.some((item) => item.client.id === option.client.id)) {
                return prev
            }

            return [...prev, { client: option.client, relation: '' }]
        })
    }

    const handleRemoveRelative = (clientId: string) => {
        setSelectedRelatives((prev) =>
            prev.filter((relative) => relative.client.id !== clientId),
        )
    }

    const canProceedFromNote = selectedRelatives.every(
        (relative) => Boolean(relative.relation),
    )

    const relativesSummary = useMemo(() => {
        if (selectedRelatives.length === 0) return ''
        return selectedRelatives
            .map(
                (relative) =>
                    `${relative.client.fullName} (${formatFixationKinship(relative.relation)})`,
            )
            .join(', ')
    }, [selectedRelatives])

    const hasPreferences = Boolean(
        desiredArea ||
            desiredRooms ||
            paymentFormat ||
            budget.trim() ||
            meetingDate,
    )
    const hasComment = Boolean(note.trim())
    const preferencesSummary = useMemo(() => {
        const parts: string[] = []

        if (desiredArea) parts.push(`Площадь: ${desiredArea} м²`)
        if (desiredRooms) parts.push(`Комнат: ${desiredRooms}`)
        if (paymentFormat) parts.push(`Оплата: ${paymentFormat}`)
        if (budget.trim()) {
            parts.push(`Бюджет: ${formatBudgetValue(budget)} ₽`)
        }
        if (meetingDate) {
            parts.push(`Встреча: ${formatYMDToDMY(meetingDate)}`)
        }

        return parts.join('\n')
    }, [
        budget,
        desiredArea,
        desiredRooms,
        meetingDate,
        paymentFormat,
    ])

    const handleCreateFixation = async () => {
        if (!selectedClient || !selectedComplex || !selectedManager) return

        try {
            setIsSubmitting(true)
            await apiCreateFixation({
                clientId: selectedClient.id,
                complexId: selectedComplex.id,
                apartmentId: selectedApartment?.id,
                managerId:
                    selectedManager === 'any'
                        ? undefined
                        : selectedManager.id,
                relatives: selectedRelatives.map((relative) => ({
                    clientId: relative.client.id,
                    relation: relative.relation,
                })),
                note: note.trim() || undefined,
                desiredArea: desiredArea || undefined,
                desiredRooms: desiredRooms || undefined,
                paymentFormat: paymentFormat || undefined,
                budget: budget.trim() || undefined,
                meetingDate: meetingDate || undefined,
            })
            await mutate('/api/fixations')
            toast.push(
                <Notification type="success">Фиксация создана</Notification>,
                { placement: 'top-center' },
            )
            onClose()
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Не удалось создать фиксацию'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const meta =
        step === 'client-create'
            ? {
                  title: 'Создать клиента',
                  description:
                      'Заполните данные — клиент будет создан и сразу выбран',
              }
            : STEP_META[step]

    const isClientStep = step === 'client' || step === 'client-create'

    return (
        <>
        <Dialog
            isOpen={isOpen}
            width={820}
            height={isClientStep ? '90vh' : undefined}
            className={
                isClientStep
                    ? 'h-[90vh] max-h-[90vh]'
                    : 'max-h-[calc(100dvh-4rem)]'
            }
            onClose={onClose}
            onRequestClose={onClose}
            contentClassName={classNames(
                'flex min-h-0 flex-col overflow-hidden !p-4 sm:!p-6',
                isClientStep
                    ? 'h-full max-h-[90vh]'
                    : 'max-h-[calc(100dvh-4rem)]',
            )}
        >
            <div className="flex min-h-0 flex-1 flex-col gap-4">
                <div className="shrink-0 pr-12">
                    <Steps
                        className="mb-3 sm:mb-4 [&_.step-item-content]:hidden sm:[&_.step-item-content]:block [&_.step-item-icon]:h-8 [&_.step-item-icon]:min-w-8 [&_.step-item-icon]:w-8 [&_.step-item-icon]:text-sm sm:[&_.step-item-icon]:h-9 sm:[&_.step-item-icon]:min-w-9 sm:[&_.step-item-icon]:w-9 sm:[&_.step-item-icon]:text-lg [&_.step-connect]:!ml-0 sm:[&_.step-connect.step-title]:!ml-2.5"
                        current={currentStepIndex}
                        isStepEnabled={canGoToStep}
                        onChange={handleStepIndexChange}
                    >
                        <Steps.Item title="Клиент" />
                        <Steps.Item title="ЖК" />
                        <Steps.Item title="Предпочтения" />
                        <Steps.Item title="Итог" />
                    </Steps>
                    <h5 className="mb-1 text-base font-semibold sm:text-lg">
                        {meta.title}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {meta.description}
                    </p>
                </div>

                <div
                    className={classNames(
                        'min-h-0 flex-1',
                        step === 'client'
                            ? 'flex flex-col overflow-hidden'
                            : 'overflow-y-auto overscroll-contain px-1',
                    )}
                    onScroll={(event) => {
                        if (event.target !== event.currentTarget) return

                        if (!isSelectControlFocused()) {
                            selectMenuScrollAnchorRef.current = null
                            return
                        }

                        const scrollTop = event.currentTarget.scrollTop

                        if (selectMenuScrollAnchorRef.current === null) {
                            selectMenuScrollAnchorRef.current = scrollTop
                            return
                        }

                        if (
                            Math.abs(
                                scrollTop - selectMenuScrollAnchorRef.current,
                            ) >= SELECT_MENU_CLOSE_SCROLL_PX
                        ) {
                            closeOpenSelectMenus()
                            selectMenuScrollAnchorRef.current = null
                        }
                    }}
                >                    {step === 'client-create' ? (
                        <Form onSubmit={handleSubmit(handleCreateClient)}>
                            <div className="grid gap-y-3 md:grid-cols-3 md:gap-x-4 md:gap-y-3">
                                <FormItem
                                    asterisk
                                    label="Фамилия"
                                    invalid={Boolean(clientErrors.lastName)}
                                    errorMessage={
                                        clientErrors.lastName?.message
                                    }
                                >
                                    <Controller
                                        name="lastName"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Иванов"
                                                autoComplete="family-name"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                                <FormItem
                                    asterisk
                                    label="Имя"
                                    invalid={Boolean(clientErrors.firstName)}
                                    errorMessage={
                                        clientErrors.firstName?.message
                                    }
                                >
                                    <Controller
                                        name="firstName"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Иван"
                                                autoComplete="given-name"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                                <FormItem
                                    label="Отчество"
                                    invalid={Boolean(clientErrors.middleName)}
                                    errorMessage={
                                        clientErrors.middleName?.message
                                    }
                                >
                                    <Controller
                                        name="middleName"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Иванович"
                                                autoComplete="additional-name"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                            </div>
                            <FormItem
                                asterisk
                                label="Телефон"
                                className="mt-1"
                                invalid={Boolean(clientErrors.phone)}
                                errorMessage={clientErrors.phone?.message}
                            >
                                <Controller
                                    name="phone"
                                    control={control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            value={field.value ?? ''}
                                            onBlur={field.onBlur}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </FormItem>
                            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                                <Button
                                    type="button"
                                    className="w-full sm:w-auto"
                                    onClick={() => setStep('client')}
                                >
                                    Назад к списку
                                </Button>
                                <Button
                                    variant="solid"
                                    type="submit"
                                    className="w-full sm:w-auto"
                                    loading={isCreatingClient}
                                    disabled={!isClientFormValid}
                                >
                                    Создать и выбрать
                                </Button>
                            </div>
                        </Form>
                    ) : null}

                    {step === 'client' ? (
                        !hasClientsLoaded && isClientsLoading ? (
                            <div className="flex h-full min-h-48 flex-1 items-center justify-center text-sm text-gray-500">
                                Загрузка клиентов...
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="shrink-0 space-y-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <Input
                                        placeholder="Поиск по телефону или ФИО"
                                        value={clientPhoneQuery}
                                        suffix={
                                            <CloseButton
                                                resetDefaultClass
                                                className={classNames(
                                                    'text-base text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 outline-none focus:outline-none focus:ring-0',
                                                    !clientPhoneQuery &&
                                                        'invisible pointer-events-none',
                                                )}
                                                onClick={() => {
                                                    setClientPhoneQuery('')
                                                    setClientSearchQuery('')
                                                    setClientsPageIndex(1)
                                                }}
                                            />
                                        }
                                        onChange={(e) => {
                                            setClientPhoneQuery(e.target.value)
                                            setClientsPageIndex(1)
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="solid"
                                        block
                                        icon={<TbPlus />}
                                        onClick={() => setStep('client-create')}
                                    >
                                        Создать клиента
                                    </Button>
                                </div>

                                <div
                                    className={classNames(
                                        'min-h-0 flex-1 overflow-y-auto',
                                        isClientsLoading && 'opacity-60',
                                    )}
                                >
                                    <Table overflow={false}>
                                        <THead>
                                            <Tr>
                                                <Th className="sticky top-0 z-10 bg-white dark:bg-gray-800">
                                                    Клиент
                                                </Th>
                                                <Th className="sticky top-0 z-10 bg-white dark:bg-gray-800">
                                                    Телефон
                                                </Th>
                                            </Tr>
                                        </THead>
                                        <TBody>
                                            {orderedClients.length === 0 ? (
                                                <Tr>
                                                    <Td colSpan={2}>
                                                        <div className="flex flex-col items-center py-8 text-center">
                                                            <TbUsers className="mb-2 text-2xl text-primary" />
                                                            <p className="font-medium">
                                                                Клиенты не найдены
                                                            </p>
                                                        </div>
                                                    </Td>
                                                </Tr>
                                            ) : (
                                                orderedClients.map((client) => {
                                                    const isSelected =
                                                        selectedClient?.id ===
                                                        client.id
                                                    return (
                                                        <Tr
                                                            key={client.id}
                                                            className={classNames(
                                                                'cursor-pointer transition-colors hover:bg-primary/5 dark:hover:bg-primary/10',
                                                                isSelected &&
                                                                    SELECTED_ROW_CLASS,
                                                            )}
                                                            onClick={() =>
                                                                handleSelectClient(
                                                                    client,
                                                                )
                                                            }
                                                        >
                                                            <Td>
                                                                <span className="font-medium">
                                                                    {
                                                                        client.fullName
                                                                    }
                                                                </span>
                                                            </Td>
                                                            <Td>
                                                                {client.phone}
                                                            </Td>
                                                        </Tr>
                                                    )
                                                })
                                            )}
                                        </TBody>
                                    </Table>
                                </div>

                                <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                    <Pagination
                                        pageSize={clientsPageSize}
                                        currentPage={clientsPageIndex}
                                        total={clientsTotal}
                                        onChange={setClientsPageIndex}
                                    />
                                    <div className="min-w-[130px]">
                                        <Select
                                            size="sm"
                                            menuPlacement="top"
                                            isSearchable={false}
                                            value={clientsPageSizeOptions.filter(
                                                (option) =>
                                                    option.value ===
                                                    clientsPageSize,
                                            )}
                                            options={clientsPageSizeOptions}
                                            onChange={(option) => {
                                                const size =
                                                    (
                                                        option as {
                                                            value: number
                                                        } | null
                                                    )?.value || 20
                                                setClientsPageSize(size)
                                                setClientsPageIndex(1)
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    ) : null}

                    {step === 'complex' ? (
                        isComplexesLoading ? (
                            <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                                Загрузка ЖК...
                            </div>
                        ) : (
                            <div className="grid min-w-0 gap-4">
                                <FormItem asterisk label="Жилой комплекс">
                                    <Select
                                        {...selectMenuProps}
                                        placeholder="Выберите ЖК"
                                        options={complexOptions}
                                        value={
                                            complexOptions.find(
                                                (item) =>
                                                    item.value ===
                                                    selectedComplex?.id,
                                            ) || null
                                        }
                                        onChange={(option) =>
                                            handleComplexChange(
                                                option as SelectOption | null,
                                            )
                                        }
                                    />
                                </FormItem>
                                <FormItem asterisk label="Менеджер">
                                    <Select
                                        {...selectMenuProps}
                                        isDisabled={!selectedComplex}
                                        placeholder="Выберите менеджера"
                                        options={managerOptions}
                                        value={selectedManagerOption}
                                        onChange={(option) => {
                                            const value = (
                                                option as SelectOption | null
                                            )?.value

                                            if (!value) {
                                                setSelectedManager(null)
                                                return
                                            }

                                            if (value === ANY_MANAGER_VALUE) {
                                                setSelectedManager('any')
                                                return
                                            }

                                            const manager =
                                                selectedComplex?.managers.find(
                                                    (item) =>
                                                        item.id === value,
                                                ) || null
                                            setSelectedManager(manager)
                                        }}
                                    />
                                </FormItem>
                                <FormItem className="min-w-0" label="Квартира (необязательно)">
                                    {!selectedComplex ? (
                                        <div className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                                            Сначала выберите жилой комплекс
                                        </div>
                                    ) : isCheckboardLoading ? (
                                        <div className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                                            Загрузка шахматки...
                                        </div>
                                    ) : !isApartmentCheckboardCollapsed &&
                                      !selectedComplexCheckboard ? (
                                        <div className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                                            Не удалось загрузить шахматку для выбранного ЖК
                                        </div>
                                    ) : (
                                        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                                            <div className="flex items-start gap-2">
                                                <button
                                                    type="button"
                                                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                                                    onClick={() =>
                                                        setIsApartmentCheckboardCollapsed(
                                                            (prev) => !prev,
                                                        )
                                                    }
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            Выбор квартиры на шахматке
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                            {selectedApartment
                                                                ? `Выбрано: кв. ${selectedApartment.number}`
                                                                : 'Квартира не выбрана'}
                                                        </p>
                                                    </div>
                                                    <HiChevronDown
                                                        className={classNames(
                                                            'shrink-0 text-xl text-gray-400 transition-transform',
                                                            !isApartmentCheckboardCollapsed &&
                                                                'rotate-180',
                                                        )}
                                                    />
                                                </button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="shrink-0"
                                                    icon={<TbArrowsMaximize />}
                                                    onClick={
                                                        openCheckboardFullscreen
                                                    }
                                                >
                                                    <span className="hidden sm:inline">
                                                        На весь экран
                                                    </span>
                                                </Button>
                                            </div>

                                            {!isApartmentCheckboardCollapsed ? (
                                                <>
                                                    <div className="mt-3 mb-3 flex flex-wrap items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={
                                                                selectedApartment ===
                                                                null
                                                                    ? 'solid'
                                                                    : 'default'
                                                            }
                                                            onClick={() => {
                                                                setSelectedApartment(
                                                                    null,
                                                                )
                                                                setSelectedPropertyId(
                                                                    null,
                                                                )
                                                            }}
                                                        >
                                                            Без квартиры
                                                        </Button>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            Выберите квартиру на шахматке объекта
                                                        </span>
                                                    </div>

                                                    <div
                                                        className="checkboard-scroll max-h-[calc(100dvh-12rem)] min-w-0 w-full max-w-full overflow-x-auto overflow-y-auto overscroll-contain rounded-lg border border-gray-200 p-2 dark:border-gray-700"
                                                        onWheel={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        onTouchMove={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                    {selectedComplexCheckboard ? (
                                                        <CheckboardClassic
                                                            building={
                                                                selectedComplexCheckboard
                                                            }
                                                            labelMode={
                                                                checkboardLabelMode
                                                            }
                                                            selectedPropertyId={
                                                                selectedPropertyId
                                                            }
                                                            onPropertySelect={
                                                                handleCheckboardPropertySelect
                                                            }
                                                        />
                                                    ) : null}
                                                    </div>

                                                    {selectedApartment ? (
                                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                            Выбрано: кв.{' '}
                                                            {selectedApartment.number}
                                                            {selectedApartment.rooms
                                                                ? ` · ${selectedApartment.rooms}-комн.`
                                                                : ''}
                                                        </p>
                                                    ) : null}
                                                </>
                                            ) : null}
                                        </div>
                                    )}
                                </FormItem>
                            </div>
                        )
                    ) : null}

                    {step === 'note' ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormItem label="Желаемая площадь от, м²">
                                <Select
                                    {...selectMenuProps}
                                    isClearable
                                    placeholder="Выберите диапазон"
                                    options={desiredAreaOptions}
                                    value={
                                        desiredAreaOptions.find(
                                            (o) => o.value === desiredArea,
                                        ) || null
                                    }
                                    onChange={(option) =>
                                        setDesiredArea(
                                            (
                                                option as SelectOption | null
                                            )?.value || '',
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Кол-во комнат">
                                <Select
                                    {...selectMenuProps}
                                    isClearable
                                    placeholder="Выберите вариант"
                                    options={desiredRoomsOptions}
                                    value={
                                        desiredRoomsOptions.find(
                                            (o) => o.value === desiredRooms,
                                        ) || null
                                    }
                                    onChange={(option) =>
                                        setDesiredRooms(
                                            (
                                                option as SelectOption | null
                                            )?.value || '',
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Формат оплаты">
                                <Select
                                    {...selectMenuProps}
                                    isClearable
                                    placeholder="Выберите вариант"
                                    options={paymentFormatOptions}
                                    value={
                                        paymentFormatOptions.find(
                                            (o) =>
                                                o.value === paymentFormat,
                                        ) || null
                                    }
                                    onChange={(option) =>
                                        setPaymentFormat(
                                            (
                                                option as SelectOption | null
                                            )?.value || '',
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Бюджет, ₽">
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Укажите бюджет"
                                    value={formatBudgetValue(budget)}
                                    onChange={(e) =>
                                        setBudget(e.target.value.replace(/\D/g, ''))
                                    }
                                />
                            </FormItem>

                            <FormItem
                                className="md:col-span-2"
                                label="Планируемая дата встречи"
                            >
                                <DatePicker
                                    placeholder="Выберите дату"
                                    locale="ru"
                                    inputFormat="DD.MM.YYYY"
                                    value={
                                        meetingDate
                                            ? new Date(meetingDate)
                                            : null
                                    }
                                    onChange={(date) =>
                                        setMeetingDate(
                                            date ? formatYMD(date) : '',
                                        )
                                    }
                                />
                            </FormItem>

                            <div className="md:col-span-2 space-y-3">
                                <FormItem label="Родственники">
                                    <Select
                                        {...selectMenuProps}
                                        key={[
                                            selectedClient?.id || 'none',
                                            ...selectedRelatives.map(
                                                (relative) => relative.client.id,
                                            ),
                                        ].join('-')}
                                        componentAs={AsyncSelect}
                                        components={relativeOptionComponents}
                                        defaultOptions
                                        cacheOptions={false}
                                        isClearable={false}
                                        isSearchable
                                        controlShouldRenderValue={false}
                                        hideSelectedOptions
                                        placeholder="Найти клиента по ФИО или телефону"
                                        loadOptions={loadRelativeOptions}
                                        value={null}
                                        onChange={(option) =>
                                            handleAddRelative(
                                                option as ClientSelectOption | null,
                                            )
                                        }
                                        noOptionsMessage={({ inputValue }) =>
                                            inputValue
                                                ? 'Клиенты не найдены'
                                                : 'Начните вводить ФИО или телефон'
                                        }
                                        loadingMessage={() => 'Поиск...'}
                                    />
                                </FormItem>

                                {selectedRelatives.length > 0 ? (
                                    <div className="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                                        {selectedRelatives.map((relative) => (
                                            <div
                                                key={relative.client.id}
                                                className="space-y-2"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {
                                                                relative.client
                                                                    .fullName
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {
                                                                relative.client
                                                                    .phone
                                                            }
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="plain"
                                                        className="shrink-0 text-red-500 hover:text-red-600"
                                                        icon={<TbTrash />}
                                                        onClick={() =>
                                                            handleRemoveRelative(
                                                                relative.client
                                                                    .id,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <Select
                                                    {...selectMenuProps}
                                                    placeholder="Степень родства"
                                                    options={
                                                        kinshipSelectOptions
                                                    }
                                                    value={
                                                        kinshipSelectOptions.find(
                                                            (option) =>
                                                                option.value ===
                                                                relative.relation,
                                                        ) || null
                                                    }
                                                    onChange={(option) => {
                                                        const value =
                                                            (
                                                                option as SelectOption | null
                                                            )?.value || ''
                                                        setSelectedRelatives(
                                                            (prev) =>
                                                                prev.map(
                                                                    (item) =>
                                                                        item
                                                                            .client
                                                                            .id ===
                                                                        relative
                                                                            .client
                                                                            .id
                                                                            ? {
                                                                                  ...item,
                                                                                  relation:
                                                                                      value,
                                                                              }
                                                                            : item,
                                                                ),
                                                        )
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <div className="md:col-span-2">
                                <FormItem label="Предпочтения">
                                    <Input
                                        textArea
                                        rows={5}
                                        className="max-h-40 overflow-y-auto resize-none"
                                        placeholder="Комментарий"
                                        value={note}
                                        onChange={(e) =>
                                            setNote(e.target.value)
                                        }
                                    />
                                </FormItem>
                            </div>
                        </div>
                    ) : null}

                    {step === 'confirm' ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <SummaryCard
                                icon={<TbUser />}
                                label="Клиент"
                                title={selectedClient?.fullName || '—'}
                                subtitle={selectedClient?.phone}
                                isFilled={Boolean(selectedClient)}
                                onEdit={() => setStep('client')}
                            />
                            <SummaryCard
                                icon={<TbBuilding />}
                                label="ЖК"
                                title={selectedComplex?.name || '—'}
                                subtitle={selectedComplex?.address}
                                isFilled={Boolean(selectedComplex)}
                                onEdit={() => setStep('complex')}
                            />
                            <SummaryCard
                                icon={<TbHome />}
                                label="Квартира"
                                title={
                                    selectedApartment
                                        ? `кв. ${selectedApartment.number}`
                                        : 'Не указана'
                                }
                                subtitle={
                                    selectedApartment?.rooms
                                        ? `${selectedApartment.rooms}-комн.`
                                        : undefined
                                }
                                isFilled={Boolean(selectedApartment)}
                                onEdit={() => setStep('complex')}
                            />
                            <SummaryCard
                                icon={<TbUsers />}
                                label="Менеджер"
                                title={
                                    selectedManager === 'any'
                                        ? 'Любой'
                                        : selectedManager?.fullName || '—'
                                }
                                subtitle={
                                    selectedManager === 'any'
                                        ? undefined
                                        : selectedManager?.phone
                                }
                                isFilled={Boolean(selectedManager)}
                                onEdit={() => setStep('complex')}
                            />
                            <SummaryCard
                                icon={<TbUsers />}
                                label="Родственники"
                                title={
                                    relativesSummary || 'Не указаны'
                                }
                                subtitle={
                                    selectedRelatives.length > 0
                                        ? selectedRelatives
                                              .map(
                                                  (relative) =>
                                                      relative.client.phone,
                                              )
                                              .join(', ')
                                        : undefined
                                }
                                isFilled={selectedRelatives.length > 0}
                                onEdit={() => setStep('note')}
                            />
                            <SummaryCard
                                icon={<TbNote />}
                                label="Предпочтения"
                                title={preferencesSummary || 'Не указано'}
                                isFilled={hasPreferences}
                                scrollableContent
                                onEdit={() => setStep('note')}
                            />
                            <div className="md:col-span-2">
                                <SummaryCard
                                    icon={<TbMessage />}
                                    label="Комментарий"
                                    title={note.trim() || 'Не указано'}
                                    isFilled={hasComment}
                                    scrollableContent
                                    onEdit={() => setStep('note')}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {step !== 'client-create' && step !== 'client' ? (
                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 pt-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            className="w-full sm:w-auto"
                            icon={<TbArrowLeft />}
                            onClick={() => {
                                if (step === 'complex') setStep('client')
                                if (step === 'note') setStep('complex')
                                if (step === 'confirm') setStep('note')
                            }}
                        >
                            Назад
                        </Button>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                                type="button"
                                className="w-full sm:w-auto"
                                onClick={onClose}
                            >
                                Отмена
                            </Button>
                            {step === 'complex' ? (
                                <Button
                                    variant="solid"
                                    className="w-full sm:w-auto"
                                    disabled={!canProceedFromComplex}
                                    onClick={() => setStep('note')}
                                >
                                    Далее
                                </Button>
                            ) : null}
                            {step === 'note' ? (
                                <Button
                                    variant="solid"
                                    className="w-full sm:w-auto"
                                    disabled={!canProceedFromNote}
                                    onClick={() => setStep('confirm')}
                                >
                                    Далее
                                </Button>
                            ) : null}
                            {step === 'confirm' ? (
                                <Button
                                    variant="solid"
                                    className="w-full sm:w-auto"
                                    loading={isSubmitting}
                                    onClick={() => void handleCreateFixation()}
                                >
                                    Создать
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {step === 'client' ? (
                    <div className="flex shrink-0 justify-end border-t border-gray-200 pt-3 dark:border-gray-700">
                        <Button
                            type="button"
                            className="w-full sm:w-auto"
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                    </div>
                ) : null}
            </div>
        </Dialog>

        <Dialog
            isOpen={isCheckboardFullscreen}
            width={
                typeof window !== 'undefined'
                    ? Math.max(window.innerWidth - 24, 320)
                    : 1200
            }
            className="!mx-3 !my-3 max-h-[95dvh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)]"
            overlayClassName="!z-[60]"
            contentClassName="flex max-h-[95dvh] min-h-0 flex-col overflow-hidden !p-4 sm:!p-5"
            onClose={() => setIsCheckboardFullscreen(false)}
            onRequestClose={() => setIsCheckboardFullscreen(false)}
        >
            <div className="flex max-h-[calc(95dvh-2rem)] min-h-0 flex-col gap-3">
                <div className="shrink-0 pr-10">
                    <h5 className="mb-1 text-base font-semibold sm:text-lg">
                        Выбор квартиры на шахматке
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedComplex?.name
                            ? `${selectedComplex.name} · `
                            : ''}
                        {selectedApartment
                            ? `выбрано: кв. ${selectedApartment.number}`
                            : 'выберите помещение или продолжите без квартиры'}
                    </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={
                            selectedApartment === null ? 'solid' : 'default'
                        }
                        onClick={() => {
                            setSelectedApartment(null)
                            setSelectedPropertyId(null)
                        }}
                    >
                        Без квартиры
                    </Button>
                    {selectedApartment ? (
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            кв. {selectedApartment.number}
                            {selectedApartment.rooms
                                ? ` · ${selectedApartment.rooms}-комн.`
                                : ''}
                        </span>
                    ) : null}
                </div>

                <div
                    className="checkboard-scroll max-h-[calc(95dvh-12rem)] min-h-0 min-w-0 overflow-x-auto overflow-y-auto overscroll-contain rounded-xl border border-gray-200 p-2 dark:border-gray-700"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    {isCheckboardLoading ? (
                        <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-gray-500">
                            Загрузка шахматки...
                        </div>
                    ) : selectedComplexCheckboard ? (
                        <CheckboardClassic
                            building={selectedComplexCheckboard}
                            labelMode={checkboardLabelMode}
                            selectedPropertyId={selectedPropertyId}
                            onPropertySelect={handleCheckboardPropertySelect}
                        />
                    ) : (
                        <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-gray-500">
                            Не удалось загрузить шахматку для выбранного ЖК
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                    <Button
                        type="button"
                        onClick={() => setIsCheckboardFullscreen(false)}
                    >
                        Закрыть
                    </Button>
                    <Button
                        type="button"
                        variant="solid"
                        onClick={() => setIsCheckboardFullscreen(false)}
                    >
                        Готово
                    </Button>
                </div>
            </div>
        </Dialog>
        </>
    )
}

export default FixationsCreateWizardDialog
