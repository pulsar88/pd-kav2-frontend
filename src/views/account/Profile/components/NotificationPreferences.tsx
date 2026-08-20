import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Switcher from '@/components/ui/Switcher'
import Spinner from '@/components/ui/Spinner'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiGetNotificationDictionaries,
    apiGetNotificationPreferences,
    apiUpdateNotificationPreferences,
} from '@/services/NotificationService'
import { TbBell } from 'react-icons/tb'
import {
    arePreferenceStatesEqual,
    buildPreferenceState,
    formatNotificationTypeDescription,
    formatNotificationTypeTitle,
    getPreferenceKey,
    preferenceStateToPayload,
} from '../utils/notificationPreferences'

const NOTIFICATION_LOCALE = 'ru'

const NotificationPreferences = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [preferences, setPreferences] = useState<Record<string, boolean>>({})
    const [initialPreferences, setInitialPreferences] = useState<
        Record<string, boolean>
    >({})
    const [types, setTypes] = useState<
        Awaited<
            ReturnType<typeof apiGetNotificationDictionaries>
        >['notification_types']
    >([])
    const [channels, setChannels] = useState<
        Awaited<
            ReturnType<typeof apiGetNotificationDictionaries>
        >['notification_channels']
    >([])

    useEffect(() => {
        const loadPreferences = async () => {
            setIsLoading(true)
            try {
                const [dictionaries, currentPreferences] = await Promise.all([
                    apiGetNotificationDictionaries(),
                    apiGetNotificationPreferences(),
                ])

                const nextState = buildPreferenceState(
                    dictionaries.notification_types,
                    dictionaries.notification_channels,
                    currentPreferences,
                )

                setTypes(dictionaries.notification_types)
                setChannels(dictionaries.notification_channels)
                setPreferences(nextState)
                setInitialPreferences(nextState)
            } catch (err: unknown) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Не удалось загрузить настройки уведомлений'
                toast.push(
                    <Notification type="danger">{message}</Notification>,
                    { placement: 'top-center' },
                )
            } finally {
                setIsLoading(false)
            }
        }

        loadPreferences()
    }, [])

    const isDirty = useMemo(
        () => !arePreferenceStatesEqual(preferences, initialPreferences),
        [initialPreferences, preferences],
    )

    const handleToggle = (
        typeId: number,
        channelId: number,
        checked: boolean,
    ) => {
        const key = getPreferenceKey(typeId, channelId)
        setPreferences((prevState) => ({
            ...prevState,
            [key]: checked,
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await apiUpdateNotificationPreferences({
                locale: NOTIFICATION_LOCALE,
                preferences: preferenceStateToPayload(preferences),
            })
            setInitialPreferences(preferences)
            toast.push(
                <Notification type="success">
                    Настройки уведомлений сохранены
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Не удалось сохранить настройки уведомлений'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card
            className="h-full flex flex-col"
            bodyClass="flex-1"
            header={{
                content: (
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle text-primary text-xl shrink-0">
                            <TbBell />
                        </span>
                        <div>
                            <h4 className="mb-1">Настройки уведомлений</h4>
                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                Выберите, как и куда получать уведомления
                            </p>
                        </div>
                    </div>
                ),
                bordered: true,
            }}
            footer={{
                content: (
                    <div className="flex justify-end">
                        <Button
                            variant="solid"
                            loading={isSaving}
                            disabled={!isDirty || isLoading}
                            onClick={handleSave}
                        >
                            Сохранить настройки
                        </Button>
                    </div>
                ),
                bordered: true,
            }}
        >
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Spinner size={40} />
                </div>
            ) : types.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Настройки уведомлений недоступны
                </p>
            ) : (
                <div className="flex flex-col gap-6">
                    {types.map((type) => {
                        const description =
                            formatNotificationTypeDescription(type)

                        return (
                            <div
                                key={type.id}
                                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                            >
                                <div className="mb-4">
                                    <h5 className="font-semibold heading-text">
                                        {formatNotificationTypeTitle(type)}
                                    </h5>
                                    {description ? (
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {description}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex flex-col gap-3">
                                    {channels.map((channel) => {
                                        const key = getPreferenceKey(
                                            type.id,
                                            channel.id,
                                        )

                                        return (
                                            <div
                                                key={key}
                                                className="flex items-center justify-between gap-4 py-1"
                                            >
                                                <span className="text-sm heading-text">
                                                    {channel.title}
                                                </span>
                                                <Switcher
                                                    checked={
                                                        preferences[key] ??
                                                        false
                                                    }
                                                    onChange={(checked) =>
                                                        handleToggle(
                                                            type.id,
                                                            channel.id,
                                                            checked,
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </Card>
    )
}

export default NotificationPreferences
