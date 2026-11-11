import { forwardRef, useEffect, useImperativeHandle } from 'react'
import PasswordInput from '@/components/shared/PasswordInput'
import { Form, FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiChangePassword } from '@/services/AuthService'
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
            .refine((value) => !/\s/.test(value), {
                message: 'Пароль не должен содержать пробелы',
            }),
        confirmNewPassword: z
            .string()
            .min(1, { message: 'Подтвердите новый пароль' }),
    })
    .refine((data) => data.confirmNewPassword === data.newPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmNewPassword'],
    })

const hasPasswordInput = (values: PasswordSchema) =>
    Boolean(
        values.currentPassword.trim() ||
            values.newPassword.trim() ||
            values.confirmNewPassword.trim(),
    )

export type ChangePasswordHandle = {
    save: () => Promise<boolean>
}

type ChangePasswordProps = {
    onDirtyChange?: (dirty: boolean) => void
    onRequestSave?: () => void
}

const ChangePassword = forwardRef<ChangePasswordHandle, ChangePasswordProps>(
    ({ onDirtyChange, onRequestSave }, ref) => {
        const {
            getValues,
            watch,
            setError,
            clearErrors,
            reset,
            control,
            formState: { errors },
        } = useForm<PasswordSchema>({
            defaultValues,
        })

        const values = watch()
        const dirty = hasPasswordInput(values)

        useEffect(() => {
            onDirtyChange?.(dirty)
        }, [dirty, onDirtyChange])

        useEffect(() => {
            clearErrors()
        }, [
            values.currentPassword,
            values.newPassword,
            values.confirmNewPassword,
            clearErrors,
        ])

        useImperativeHandle(ref, () => ({
            save: async () => {
                const current = getValues()
                if (!hasPasswordInput(current)) {
                    return true
                }

                const parsed = validationSchema.safeParse(current)
                if (!parsed.success) {
                    clearErrors()
                    parsed.error.issues.forEach((issue) => {
                        const field = issue.path[0]
                        if (
                            field === 'currentPassword' ||
                            field === 'newPassword' ||
                            field === 'confirmNewPassword'
                        ) {
                            setError(field, { message: issue.message })
                        }
                    })
                    return false
                }

                try {
                    await apiChangePassword({
                        old_password: parsed.data.currentPassword,
                        password: parsed.data.newPassword,
                        password_confirmation: parsed.data.confirmNewPassword,
                    })
                    reset(defaultValues)
                    toast.push(
                        <Notification type="success">Пароль обновлён</Notification>,
                        { placement: 'top-center' },
                    )
                    return true
                } catch (err: unknown) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : 'Ошибка при смене пароля'
                    toast.push(
                        <Notification type="danger">{message}</Notification>,
                        { placement: 'top-center' },
                    )
                    return false
                }
            },
        }))

        return (
            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-xl text-primary">
                        <TbLock />
                    </span>
                    <div>
                        <h4 className="mb-1">Смена пароля</h4>
                        <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            Заполните, если нужно сменить пароль. Пустые поля не
                            отправляются
                        </p>
                    </div>
                </div>
                <Form
                    onSubmit={(event) => {
                        event.preventDefault()
                        onRequestSave?.()
                    }}
                >
                    <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
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
                                        placeholder="Не короче 8 символов"
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
            </div>
        )
    },
)

ChangePassword.displayName = 'ChangePassword'

export default ChangePassword
