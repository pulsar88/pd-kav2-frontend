import { useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import PasswordInput from '@/components/shared/PasswordInput'
import { Form, FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiChangePassword } from '@/services/AuthService'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { TbLock } from 'react-icons/tb'

type PasswordSchema = {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
}

const defaultValues: PasswordSchema = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
}

const validationSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, { message: 'Введите текущий пароль' }),
        newPassword: z
            .string()
            .min(8, { message: 'Минимальная длина 8 символов' })
            .refine((v) => !/\s/.test(v), {
                message: 'Пароль не должен содержать пробелы',
            }),
        confirmNewPassword: z
            .string()
            .min(1, { message: 'Подтвердите новый пароль' }),
    })
    .refine(
        (data) =>
            !data.confirmNewPassword ||
            data.confirmNewPassword === data.newPassword,
        {
            message: 'Пароли не совпадают',
            path: ['confirmNewPassword'],
        },
    )

const ChangePassword = () => {
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    const {
        getValues,
        handleSubmit,
        formState: { errors, isValid },
        control,
        reset,
    } = useForm<PasswordSchema>({
        defaultValues,
        resolver: zodResolver(validationSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
    })

    const handlePostSubmit = async () => {
        try {
            setIsSubmitting(true)
            const values = getValues()
            await apiChangePassword({
                old_password: values.currentPassword,
                password: values.newPassword,
                password_confirmation: values.confirmNewPassword,
            })
            toast.push(
                <Notification type="success">Пароль обновлён</Notification>,
                { placement: 'top-center' },
            )
            setConfirmationOpen(false)
            reset(defaultValues)
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Ошибка при смене пароля'
            toast.push(<Notification type="danger">{message}</Notification>, {
                placement: 'top-center',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const onSubmit = async () => {
        setConfirmationOpen(true)
    }

    return (
        <Card
            className="h-full flex flex-col"
            bodyClass="flex-1"
            header={{
                content: (
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle text-primary text-xl shrink-0">
                            <TbLock />
                        </span>
                        <div>
                            <h4 className="mb-1">Смена пароля</h4>
                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                Используйте надёжный пароль не короче 8
                                символов
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
                            type="submit"
                            form="change-password-form"
                            disabled={!isValid}
                        >
                            Обновить пароль
                        </Button>
                    </div>
                ),
                bordered: true,
            }}
        >
            <Form
                id="change-password-form"
                ref={formRef}
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <FormItem
                        className="md:col-span-2"
                        label="Текущий пароль"
                        invalid={Boolean(errors.currentPassword)}
                        errorMessage={errors.currentPassword?.message}
                    >
                        <Controller
                            name="currentPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="current-password"
                                    placeholder="Введите текущий пароль"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Новый пароль"
                        invalid={Boolean(errors.newPassword)}
                        errorMessage={errors.newPassword?.message}
                    >
                        <Controller
                            name="newPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Введите новый пароль"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Подтвердите пароль"
                        invalid={Boolean(errors.confirmNewPassword)}
                        errorMessage={errors.confirmNewPassword?.message}
                    >
                        <Controller
                            name="confirmNewPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Повторите новый пароль"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            )}
                        />
                    </FormItem>
                </div>
            </Form>
            <ConfirmDialog
                isOpen={confirmationOpen}
                type="warning"
                title="Обновить пароль"
                confirmText="Обновить"
                cancelText="Отмена"
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handlePostSubmit,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>Вы уверены, что хотите изменить пароль?</p>
            </ConfirmDialog>
        </Card>
    )
}

export default ChangePassword
