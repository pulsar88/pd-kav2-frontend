import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import DatePicker from '@/components/ui/DatePicker'
import { Form, FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiChangeUserAccessLevel,
    apiGetAccessLevels,
} from '@/services/UsersService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import type { AccessLevelOption, AdminUserListItem } from '@/@types/users'
import { TbCrown, TbUser } from 'react-icons/tb'
import classNames from '@/utils/classNames'
import {
    formatAccessLevelDate,
    getAccessLevelExpiryLabel,
} from './accessLevelUtils'

type LevelSelectOption = {
    value: number
    label: string
    code: string
}

type ChangeUserAccessLevelDialogProps = {
    isOpen: boolean
    user: AdminUserListItem | null
    onClose: () => void
    onSuccess: () => void
}

const selectMenuProps = {
    menuPortalTarget:
        typeof document !== 'undefined' ? document.body : undefined,
    menuPosition: 'fixed' as const,
    styles: {
        menuPortal: (base: Record<string, unknown>) => ({
            ...base,
            zIndex: 80,
        }),
    },
}

const toLevelOptions = (items: AccessLevelOption[]): LevelSelectOption[] =>
    items.map((item) => ({
        value: item.value,
        label: item.name || item.code,
        code: item.code,
    }))

const ChangeUserAccessLevelDialog = ({
    isOpen,
    user,
    onClose,
    onSuccess,
}: ChangeUserAccessLevelDialogProps) => {
    const [levels, setLevels] = useState<LevelSelectOption[]>([])
    const [selectedLevel, setSelectedLevel] = useState<LevelSelectOption | null>(
        null,
    )
    const [expiresAt, setExpiresAt] = useState<Date | null>(null)
    const [isLoadingLevels, setIsLoadingLevels] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const currentLevelName = user?.access_level?.name ?? ''
    const currentLevelCode = user?.access_level?.code ?? ''
    const currentExpiresAt = user?.access_level_expires_at ?? null

    // Предзаполняем форму текущими значениями пользователя
    const resetForm = useCallback(() => {
        setExpiresAt(
            currentExpiresAt && dayjs(currentExpiresAt).isValid()
                ? dayjs(currentExpiresAt).toDate()
                : null,
        )
    }, [currentExpiresAt])

    useEffect(() => {
        if (!isOpen) {
            setSelectedLevel(null)
            setExpiresAt(null)
            return
        }

        resetForm()

        let cancelled = false

        const fetchLevels = async () => {
            setIsLoadingLevels(true)
            try {
                const items = await apiGetAccessLevels()
                if (cancelled) return

                const options = toLevelOptions(items)
                setLevels(options)
                setSelectedLevel(
                    options.find(
                        (option) =>
                            (currentLevelCode &&
                                option.code === currentLevelCode) ||
                            (currentLevelName &&
                                option.label === currentLevelName),
                    ) ?? null,
                )
            } catch (err: unknown) {
                if (cancelled) return
                toast.push(
                    <Notification type="danger">
                        {getApiErrorMessage(
                            err,
                            'Не удалось загрузить уровни доступа',
                        )}
                    </Notification>,
                    { placement: 'top-center' },
                )
            } finally {
                if (!cancelled) setIsLoadingLevels(false)
            }
        }

        void fetchLevels()

        return () => {
            cancelled = true
        }
    }, [isOpen, resetForm, currentLevelCode, currentLevelName])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) return

        if (!selectedLevel) {
            toast.push(
                <Notification type="warning">
                    Пожалуйста, выберите уровень доступа
                </Notification>,
                { placement: 'top-center' },
            )
            return
        }

        setIsSubmitting(true)
        try {
            await apiChangeUserAccessLevel(user.id, {
                access_level: selectedLevel.value,
                ...(expiresAt
                    ? { expires_at: dayjs(expiresAt).format('YYYY-MM-DD') }
                    : {}),
            })
            toast.push(
                <Notification type="success">
                    Уровень доступа пользователя «{user.name}» изменён
                </Notification>,
                { placement: 'top-center' },
            )
            onClose()
            onSuccess()
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(
                        err,
                        'Не удалось сменить уровень доступа пользователя',
                    )}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-8rem)]"
            style={{
                content: {
                    position: 'fixed',
                    inset: 'unset',
                    top: '50%',
                    left: '50%',
                    margin: 0,
                    transform: 'translate(-50%, -50%)',
                },
            }}
            width={460}
            contentClassName={classNames(
                'flex min-h-0 flex-col overflow-visible !p-4 sm:!p-6 !my-0 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-8rem)]',
            )}
        >
            <div className="min-w-0">
                <div className="mb-5 flex items-start gap-3 pr-8 sm:items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                        <TbCrown />
                    </span>
                    <div className="min-w-0">
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">
                            Уровень доступа
                        </h4>
                        <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <TbUser className="shrink-0" />
                            <span className="truncate">
                                {user?.name || 'Пользователь'}
                            </span>
                        </p>
                    </div>
                </div>

                <Alert showIcon type="info" className="mb-4">
                    <span className="text-sm">
                        Текущий уровень:{' '}
                        <b>{currentLevelName || 'не задан'}</b>
                        {currentLevelName ? (
                            <>
                                {' '}
                                — {getAccessLevelExpiryLabel(currentExpiresAt).toLowerCase()}
                            </>
                        ) : null}
                    </span>
                </Alert>

                <Form onSubmit={handleSubmit}>
                    <FormItem label="Новый уровень" asterisk>
                        <Select<LevelSelectOption>
                            placeholder={
                                isLoadingLevels
                                    ? 'Загрузка уровней...'
                                    : 'Выберите уровень'
                            }
                            options={levels}
                            value={selectedLevel}
                            isLoading={isLoadingLevels}
                            isSearchable={false}
                            noOptionsMessage={() => 'Уровни не найдены'}
                            onChange={(option) => setSelectedLevel(option)}
                            {...selectMenuProps}
                        />
                        {isLoadingLevels ? (
                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                <Spinner size={12} /> Загрузка уровней...
                            </p>
                        ) : null}
                    </FormItem>

                    <FormItem label="Действует до">
                        <DatePicker
                            value={expiresAt}
                            locale="ru"
                            inputFormat="DD.MM.YYYY"
                            placeholder="Без ограничения срока"
                            minDate={dayjs().startOf('day').toDate()}
                            onChange={(value) => setExpiresAt(value ?? null)}
                        />
                        <p className="mt-2 text-xs text-gray-400">
                            {expiresAt
                                ? `Уровень будет действовать до ${formatAccessLevelDate(
                                      dayjs(expiresAt).format('YYYY-MM-DD'),
                                  )} включительно.`
                                : 'Если дату не указывать, уровень останется без ограничения срока.'}
                        </p>
                    </FormItem>

                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="plain"
                            className="w-full sm:w-auto"
                            disabled={isSubmitting}
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            className="w-full sm:w-auto"
                            loading={isSubmitting}
                            disabled={!selectedLevel || isLoadingLevels}
                        >
                            Сохранить уровень
                        </Button>
                    </div>
                </Form>
            </div>
        </Dialog>
    )
}

export default ChangeUserAccessLevelDialog
