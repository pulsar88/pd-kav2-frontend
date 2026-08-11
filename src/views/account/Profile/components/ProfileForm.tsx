import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import Upload from '@/components/ui/Upload'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import { Form, FormItem } from '@/components/ui/Form'
import PhoneInput from '@/components/shared/PhoneInput'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiGetSettingsProfile,
    apiUpdateSettingsProfile,
} from '@/services/AccountsService'
import useSWR from 'swr'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { HiOutlineUser } from 'react-icons/hi'
import {
    TbBriefcase,
    TbBuilding,
    TbMail,
    TbPlus,
    TbTrash,
    TbUser,
} from 'react-icons/tb'
import type { GetSettingsProfileResponse } from '../types'

type ProfileSchema = {
    fullName: string
    email: string
    phone: string
    img: string
}

const validationSchema = z.object({
    fullName: z.string().min(1, { message: 'Введите ФИО' }),
    email: z.email({ message: 'Введите корректный email' }),
    phone: z
        .string()
        .min(1, { message: 'Введите номер телефона' })
        .regex(/^\+7 \d{3} \d{3} \d{2} \d{2}$/, {
            message: 'Введите номер телефона',
        }),
    img: z.string(),
})

const ProfileForm = () => {
    const { data, mutate } = useSWR(
        '/api/setting/profile',
        () => apiGetSettingsProfile<GetSettingsProfileResponse>(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

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
    })

    const watchedImg = useWatch({ control, name: 'img' })

    useEffect(() => {
        if (data) {
            reset({
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                img: data.img,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    const onSubmit = async (values: ProfileSchema) => {
        try {
            const updated = await apiUpdateSettingsProfile<
                GetSettingsProfileResponse,
                ProfileSchema
            >(values)
            mutate(updated, false)
            reset(values)
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

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                <Card className="xl:col-span-4 h-full" bodyClass="p-0">
                    <div className="px-6 py-6">
                        <Controller
                            name="img"
                            control={control}
                            render={({ field }) => (
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
                                        {data?.email || 'email@example.com'}
                                    </p>
                                    <div className="flex items-center gap-2 mb-5">
                                        <Upload
                                            showList={false}
                                            uploadLimit={1}
                                            beforeUpload={beforeUpload}
                                            onChange={(files) => {
                                                if (files.length > 0) {
                                                    field.onChange(
                                                        URL.createObjectURL(
                                                            files[0],
                                                        ),
                                                    )
                                                }
                                            }}
                                        >
                                            <Button
                                                variant="solid"
                                                size="sm"
                                                type="button"
                                                icon={<TbPlus />}
                                            >
                                                Фото
                                            </Button>
                                        </Upload>
                                        {watchedImg || data?.img ? (
                                            <Button
                                                size="sm"
                                                type="button"
                                                icon={<TbTrash />}
                                                onClick={() =>
                                                    field.onChange('')
                                                }
                                            >
                                                Удалить
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        />
                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 pl-4 text-left">
                                <span
                                    className="absolute inset-y-0 left-0 w-1 bg-primary"
                                    aria-hidden
                                />
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1.5">
                                    <TbBuilding className="text-lg" />
                                    <span className="text-xs font-medium uppercase tracking-wide">
                                        Агентство
                                    </span>
                                </div>
                                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                                    {data?.agency || '—'}
                                </div>
                            </div>
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
                                {/* <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 pl-4 text-left">
                                    <span
                                        className="absolute inset-y-0 left-0 w-1 bg-primary"
                                        aria-hidden
                                    />
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1.5">
                                        <TbUser className="text-lg" />
                                        <span className="text-xs font-medium uppercase tracking-wide">
                                            Уровень
                                        </span>
                                    </div>
                                    <div className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                                        {data?.level || '—'}
                                    </div>
                                </div> */}
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
                                        prefix={
                                            <TbUser className="text-lg" />
                                        }
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Email"
                            invalid={Boolean(errors.email)}
                            errorMessage={errors.email?.message}
                        >
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="email"
                                        autoComplete="off"
                                        placeholder="name@example.com"
                                        prefix={
                                            <TbMail className="text-lg" />
                                        }
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Телефон"
                            invalid={Boolean(errors.phone)}
                            errorMessage={errors.phone?.message}
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
                    </div>
                </Card>
            </div>
        </Form>
    )
}

export default ProfileForm
