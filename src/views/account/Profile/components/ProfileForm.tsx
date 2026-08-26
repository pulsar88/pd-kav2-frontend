import { useCallback, useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Upload from '@/components/ui/Upload'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import { Form, FormItem } from '@/components/ui/Form'
import PhoneInput from '@/components/shared/PhoneInput'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiDeleteProfilePicture,
    apiGetCurrentUser,
    apiUpdateUser,
    apiUploadProfilePicture,
} from '@/services/AuthService'
import {
    apiCancelAgencyRequest,
    apiGetLatestAgencyRequest,
} from '@/services/AgencyService'
import { useSessionUser } from '@/store/authStore'
import { isContentManagerOnly } from '@/constants/roles.constant'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { HiOutlineUser } from 'react-icons/hi'
import {
    TbBriefcase,
    TbBuilding,
    TbMail,
    TbPlus,
    TbSend,
    TbTrash,
    TbUser,
    TbX,
} from 'react-icons/tb'
import {
    mapProfileFormToUpdateUserPayload,
    mapUserToProfileForm,
} from '../utils'
import { RU_PHONE_REGEX } from '@/views/fixations/utils'
import type { User } from '@/@types/auth'
import type { AgencyRequestStatus, JoinAgencyRequest } from '@/@types/agency'
import type { GetSettingsProfileResponse } from '../types'
import JoinAgencyDialog from './JoinAgencyDialog'
import classNames from '@/utils/classNames'

type ProfileSchema = {
    fullName: string
    email: string
    phone: string
}

const validationSchema = z.object({
    fullName: z.string().min(1, { message: 'Введите ФИО' }),
    email: z
        .string()
        .min(1, { message: 'Введите email' })
        .pipe(z.email({ message: 'Введите корректный email' })),
    phone: z
        .string()
        .min(1, { message: 'Введите номер в формате +7 9XX XXX XX XX' })
        .regex(RU_PHONE_REGEX, {
            message: 'Введите номер в формате +7 9XX XXX XX XX',
        }),
})

const agencyRequestStatusConfig: Record<
    string,
    { label: string; borderClass: string }
> = {
    pending: {
        label: 'Заявка на рассмотрении',
        borderClass: 'bg-amber-500',
    },
    approved: {
        label: 'Заявка одобрена',
        borderClass: 'bg-primary',
    },
    rejected: {
        label: 'Заявка отклонена',
        borderClass: 'bg-rose-500',
    },
    cancelled: {
        label: 'Заявка отменена',
        borderClass: 'bg-gray-400 dark:bg-gray-500',
    },
}

const getAgencyBorderClass = (status?: AgencyRequestStatus) =>
    (status && agencyRequestStatusConfig[status]?.borderClass) || 'bg-primary'

const ProfileForm = () => {
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const [data, setData] = useState<GetSettingsProfileResponse | null>(null)
    const [latestAgencyRequest, setLatestAgencyRequest] =
        useState<JoinAgencyRequest | null>(null)
    const [isAgencyRequestLoading, setIsAgencyRequestLoading] = useState(false)
    const [avatarLoading, setAvatarLoading] = useState(false)
    const [isJoinAgencyOpen, setIsJoinAgencyOpen] = useState(false)
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    const userId = user.userId
    const showAgency = !isContentManagerOnly(user.authority ?? [])
    const hasAgency = Boolean(data?.agency)

    const loadProfile = useCallback(async () => {
        const profile = mapUserToProfileForm(await apiGetCurrentUser())
        setData(profile)
        return profile
    }, [])

    useEffect(() => {
        if (!userId) {
            return
        }

        let cancelled = false

        const fetchProfile = async () => {
            try {
                await loadProfile()
            } catch (err: unknown) {
                if (cancelled) {
                    return
                }
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Не удалось загрузить профиль'
                toast.push(
                    <Notification type="danger">{message}</Notification>,
                    { placement: 'top-center' },
                )
            }
        }

        void fetchProfile()

        return () => {
            cancelled = true
        }
    }, [userId, loadProfile])

    useEffect(() => {
        if (!showAgency || !data || data.agency) {
            setLatestAgencyRequest(null)
            setIsAgencyRequestLoading(false)
            return
        }

        let cancelled = false

        const fetchLatestRequest = async () => {
            setIsAgencyRequestLoading(true)
            try {
                const request = await apiGetLatestAgencyRequest()
                if (!cancelled) {
                    setLatestAgencyRequest(request)
                }
            } catch (err: unknown) {
                if (cancelled) {
                    return
                }
                setLatestAgencyRequest(null)
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Не удалось загрузить статус заявки'
                toast.push(
                    <Notification type="danger">{message}</Notification>,
                    { placement: 'top-center' },
                )
            } finally {
                if (!cancelled) {
                    setIsAgencyRequestLoading(false)
                }
            }
        }

        void fetchLatestRequest()

        return () => {
            cancelled = true
        }
    }, [showAgency, data?.id, data?.agency])

    const latestRequestStatus = latestAgencyRequest?.status
    const latestRequestConfig = latestRequestStatus
        ? agencyRequestStatusConfig[latestRequestStatus]
        : undefined
    const isPendingRequest = latestRequestStatus === 'pending'

    const beforeUpload = (files: FileList | null) => {
        let valid: string | boolean = true

        const allowedFileType = ['image/jpeg', 'image/png']
        if (files) {
            for (const file of files) {
                if (!allowedFileType.includes(file.type)) {
                    valid = 'Загрузите файл .jpeg или .png'
                }
            }
        }

        return valid
    }

    const {
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isDirty },
        control,
    } = useForm<ProfileSchema>({
        resolver: zodResolver(validationSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
    })

    useEffect(() => {
        if (data) {
            reset({
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    const isPhoneLocked = Boolean(
        data?.phone && RU_PHONE_REGEX.test(data.phone),
    )

    const syncProfileState = (
        updatedProfile: GetSettingsProfileResponse,
        updatedUser: User,
    ) => {
        setData(updatedProfile)
        setUser(updatedUser)
    }

    const handleUploadAvatar = async (files: File[]) => {
        if (files.length === 0) {
            return
        }

        setAvatarLoading(true)
        try {
            const updatedUser = await apiUploadProfilePicture(files[0])
            const updatedProfile = mapUserToProfileForm(updatedUser)
            syncProfileState(updatedProfile, updatedUser)
            toast.push(
                <Notification type="success">
                    Фото профиля обновлено
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Не удалось загрузить фото'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setAvatarLoading(false)
        }
    }

    const handleDeleteAvatar = async () => {
        setAvatarLoading(true)
        try {
            const updatedUser = await apiDeleteProfilePicture()
            const updatedProfile = mapUserToProfileForm(updatedUser)
            syncProfileState(updatedProfile, updatedUser)
            toast.push(
                <Notification type="success">
                    Фото профиля удалено
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Не удалось удалить фото'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setAvatarLoading(false)
        }
    }

    const handleCancelAgencyRequest = async () => {
        if (!latestAgencyRequest) {
            return
        }

        setIsCancelling(true)
        try {
            const cancelled = await apiCancelAgencyRequest(
                latestAgencyRequest.id,
            )
            setLatestAgencyRequest({
                ...latestAgencyRequest,
                ...cancelled,
                agency: cancelled.agency ?? latestAgencyRequest.agency,
            })
            toast.push(
                <Notification type="success">Заявка отменена</Notification>,
                { placement: 'top-center' },
            )
            setIsCancelDialogOpen(false)
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Не удалось отменить заявку'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsCancelling(false)
        }
    }

    const handleJoinAgencySuccess = async () => {
        await loadProfile()
    }

    const onSubmit = async (values: ProfileSchema) => {
        if (!data?.id) {
            toast.push(
                <Notification type="danger">
                    Не удалось определить пользователя
                </Notification>,
                { placement: 'top-center' },
            )
            return
        }

        try {
            const updatedUser = await apiUpdateUser(
                data.id,
                mapProfileFormToUpdateUserPayload(
                    isPhoneLocked ? { ...values, phone: data.phone } : values,
                    {
                        id: data.id,
                        countryCode: data.countryCode,
                    },
                ),
                data.img || user.avatar,
            )
            const updatedProfile = mapUserToProfileForm(updatedUser)
            setData(updatedProfile)
            setUser(updatedUser)
            reset({
                fullName: updatedProfile.fullName,
                email: updatedProfile.email,
                phone: updatedProfile.phone,
            })
            toast.push(
                <Notification type="success">Профиль сохранён</Notification>,
                { placement: 'top-center' },
            )
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Не удалось сохранить профиль'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        }
    }

    const agencyBorderClass = hasAgency
        ? 'bg-primary'
        : getAgencyBorderClass(latestRequestStatus)

    return (
        <Form noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                <Card className="xl:col-span-4 h-full" bodyClass="p-0">
                    <div className="px-6 py-6">
                        <div className="flex flex-col items-center text-center">
                            <Avatar
                                size={96}
                                className="border-4 border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-300 shadow-md"
                                icon={<HiOutlineUser />}
                                src={data?.img || ''}
                            />
                            <h4 className="mt-4 mb-1 text-base font-semibold line-clamp-2">
                                {data?.fullName || 'Ваше имя'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                                {data?.email || 'Email не указан'}
                            </p>
                            <div className="flex items-center gap-2 mb-5">
                                <Upload
                                    showList={false}
                                    uploadLimit={1}
                                    disabled={avatarLoading}
                                    beforeUpload={beforeUpload}
                                    onChange={handleUploadAvatar}
                                >
                                    <Button
                                        variant="solid"
                                        size="sm"
                                        type="button"
                                        loading={avatarLoading}
                                        icon={<TbPlus />}
                                    >
                                        Фото
                                    </Button>
                                </Upload>
                                {data?.img ? (
                                    <Button
                                        size="sm"
                                        type="button"
                                        loading={avatarLoading}
                                        icon={<TbTrash />}
                                        onClick={handleDeleteAvatar}
                                    >
                                        Удалить
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            {showAgency ? (
                                <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 pl-4 text-left">
                                    <span
                                        className={classNames(
                                            'absolute inset-y-0 left-0 w-1',
                                            agencyBorderClass,
                                        )}
                                        aria-hidden
                                    />
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <TbBuilding className="text-lg" />
                                            <span className="text-xs font-medium uppercase tracking-wide">
                                                Агентство
                                            </span>
                                        </div>
                                    </div>

                                    {hasAgency ? (
                                        <div className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                                            {data?.agency}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {isAgencyRequestLoading
                                                        ? 'Загрузка статуса заявки...'
                                                        : latestRequestConfig?.label ||
                                                          'Нет агентства'}
                                                </p>
                                                {!isAgencyRequestLoading &&
                                                latestAgencyRequest?.agency
                                                    ?.name ? (
                                                    <p className="mt-0.5 text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                                                        {
                                                            latestAgencyRequest
                                                                .agency.name
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>
                                            {isPendingRequest ? (
                                                <Button
                                                    size="xs"
                                                    type="button"
                                                    className="w-full shrink-0 sm:w-auto"
                                                    customColorClass={() =>
                                                        'border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10'
                                                    }
                                                    icon={<TbX />}
                                                    disabled={
                                                        isAgencyRequestLoading
                                                    }
                                                    onClick={() =>
                                                        setIsCancelDialogOpen(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    Отменить заявку
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="xs"
                                                    variant="solid"
                                                    type="button"
                                                    className="w-full shrink-0 sm:w-auto"
                                                    icon={<TbSend />}
                                                    disabled={
                                                        isAgencyRequestLoading
                                                    }
                                                    onClick={() =>
                                                        setIsJoinAgencyOpen(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    Отправить заявку
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 gap-3">
                                <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 pl-4 text-left">
                                    <span
                                        className="absolute inset-y-0 left-0 w-1 bg-primary"
                                        aria-hidden
                                    />
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1.5">
                                        <TbBriefcase className="text-lg" />
                                        <span className="text-xs font-medium uppercase tracking-wide">
                                            Роль
                                        </span>
                                    </div>
                                    <div className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                                        {data?.role || '—'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card
                    className="xl:col-span-8 h-full flex flex-col"
                    bodyClass="flex-1"
                    header={{
                        content: (
                            <div>
                                <h4 className="mb-1">Личные данные</h4>
                                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                    Эти данные видны вам и используются для
                                    связи
                                </p>
                            </div>
                        ),
                        bordered: true,
                    }}
                    footer={{
                        content: (
                            <div className="flex justify-end">
                                <Button
                                    variant="solid"
                                    type="submit"
                                    loading={isSubmitting}
                                    disabled={!isDirty}
                                >
                                    Сохранить изменения
                                </Button>
                            </div>
                        ),
                        bordered: true,
                    }}
                >
                    <div className="grid grid-cols-1 gap-x-4">
                        <FormItem
                            label="ФИО"
                            errorMode="reserved"
                            invalid={Boolean(errors.fullName)}
                            errorMessage={errors.fullName?.message}
                        >
                            <Controller
                                name="fullName"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Иванов Иван Иванович"
                                        prefix={<TbUser className="text-lg" />}
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Email"
                            errorMode="reserved"
                            invalid={Boolean(errors.email)}
                            errorMessage={errors.email?.message}
                        >
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        inputMode="email"
                                        autoComplete="off"
                                        placeholder="name@example.com"
                                        prefix={<TbMail className="text-lg" />}
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Телефон"
                            errorMode="reserved"
                            invalid={Boolean(errors.phone)}
                            errorMessage={errors.phone?.message}
                        >
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <PhoneInput
                                        invalid={Boolean(errors.phone)}
                                        disabled={isPhoneLocked}
                                        value={field.value ?? ''}
                                        onBlur={field.onBlur}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                </Card>

                {showAgency ? (
                    <>
                        <JoinAgencyDialog
                            isOpen={isJoinAgencyOpen}
                            onClose={() => setIsJoinAgencyOpen(false)}
                            onSuccess={() => {
                                void handleJoinAgencySuccess()
                            }}
                        />

                        <ConfirmDialog
                            isOpen={isCancelDialogOpen}
                            type="warning"
                            title="Отменить заявку?"
                            confirmText="Отменить заявку"
                            cancelText="Закрыть"
                            confirmButtonProps={{
                                loading: isCancelling,
                                customColorClass: () =>
                                    'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 border-rose-600',
                            }}
                            onCancel={() => setIsCancelDialogOpen(false)}
                            onConfirm={() => {
                                void handleCancelAgencyRequest()
                            }}
                            onClose={() => setIsCancelDialogOpen(false)}
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Заявка на присоединение к агентству будет
                                отменена. Вы сможете отправить новую заявку
                                позже.
                            </p>
                        </ConfirmDialog>
                    </>
                ) : null}
            </div>
        </Form>
    )
}

export default ProfileForm
