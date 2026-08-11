import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import ActionLink from '@/components/shared/ActionLink'
import { apiResetPassword } from '@/services/AuthService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

type ResetPasswordProps = {
    signInUrl?: string
}

type ResetPasswordFormSchema = {
    code: string
    uniquePart: string
    newPassword: string
    confirmPassword: string
}

const validationSchema = z
    .object({
        code: z.string().min(1, 'Введите код из сообщения'),
        uniquePart: z.string().min(1, 'Отсутствует ключ сброса'),
        newPassword: z
            .string()
            .min(8, 'Минимум 8 символов')
            .regex(/^\S+$/, 'Пароль не должен содержать пробелы'),
        confirmPassword: z.string().min(1, 'Повторите пароль'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    })

export const ResetPasswordBase = ({
    signInUrl = '/sign-in',
}: ResetPasswordProps) => {
    const [resetComplete, setResetComplete] = useState(false)
    const [isSubmitting, setSubmitting] = useState(false)
    const [message, setMessage] = useTimeOutMessage()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const uniqueFromQuery =
        searchParams.get('unique_part') || searchParams.get('uniquePart') || ''
    const codeFromQuery = searchParams.get('code') || ''

    const {
        handleSubmit,
        formState: { errors },
        control,
        watch,
    } = useForm<ResetPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            code: codeFromQuery,
            uniquePart: uniqueFromQuery,
            newPassword: '',
            confirmPassword: '',
        },
        mode: 'onChange',
    })

    const onResetPassword = async (values: ResetPasswordFormSchema) => {
        setSubmitting(true)
        setMessage('')

        try {
            await apiResetPassword({
                password: values.newPassword,
                password_confirmation: values.confirmPassword,
                unique_part: values.uniquePart,
                code: values.code,
            })
            setResetComplete(true)
        } catch (errors) {
            setMessage(
                getApiErrorMessage(errors, 'Не удалось сбросить пароль'),
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                {resetComplete ? (
                    <>
                        <h2 className="mb-2">Пароль обновлён</h2>
                        <p className="font-semibold heading-text">
                            Теперь можно войти с новым паролем
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="mb-2">Новый пароль</h2>
                        <p className="font-semibold heading-text">
                            Введите код из сообщения и придумайте новый пароль
                        </p>
                    </>
                )}
            </div>

            {message ? (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            ) : null}

            {!resetComplete ? (
                <Form onSubmit={handleSubmit(onResetPassword)}>
                    <FormItem
                        asterisk
                        label="Код подтверждения"
                        errorMode="reserved"
                        invalid={Boolean(errors.code)}
                        errorMessage={errors.code?.message}
                    >
                        <Controller
                            name="code"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    placeholder="Код из SMS / письма"
                                    autoComplete="one-time-code"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {!uniqueFromQuery ? (
                        <FormItem
                            asterisk
                            label="Ключ сброса"
                            errorMode="reserved"
                            invalid={Boolean(errors.uniquePart)}
                            errorMessage={errors.uniquePart?.message}
                        >
                            <Controller
                                name="uniquePart"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder="unique_part из письма"
                                        autoComplete="off"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    ) : (
                        <Controller
                            name="uniquePart"
                            control={control}
                            render={({ field }) => (
                                <input type="hidden" {...field} />
                            )}
                        />
                    )}

                    <FormItem
                        asterisk
                        label="Новый пароль"
                        errorMode="reserved"
                        invalid={Boolean(errors.newPassword)}
                        errorMessage={errors.newPassword?.message}
                    >
                        <Controller
                            name="newPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Минимум 8 символов"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        className="!mb-6"
                        asterisk
                        label="Подтверждение пароля"
                        errorMode="reserved"
                        invalid={Boolean(errors.confirmPassword)}
                        errorMessage={errors.confirmPassword?.message}
                    >
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Повторите пароль"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <Button
                        block
                        loading={isSubmitting}
                        variant="solid"
                        type="submit"
                        disabled={
                            !(watch('code') || '') ||
                            !(watch('uniquePart') || '') ||
                            (watch('newPassword') || '').length < 8 ||
                            watch('newPassword') !== watch('confirmPassword')
                        }
                    >
                        Сохранить пароль
                    </Button>
                </Form>
            ) : (
                <Button
                    block
                    variant="solid"
                    type="button"
                    onClick={() => navigate(signInUrl)}
                >
                    Войти
                </Button>
            )}

            {!resetComplete ? (
                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                        Вспомнили пароль?{' '}
                    </span>
                    <ActionLink
                        to={signInUrl}
                        className="heading-text font-bold"
                        themeColor={false}
                    >
                        Войти
                    </ActionLink>
                </div>
            ) : null}
        </div>
    )
}

const ResetPassword = () => {
    return <ResetPasswordBase />
}

export default ResetPassword
