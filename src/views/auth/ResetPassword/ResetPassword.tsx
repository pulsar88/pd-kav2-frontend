import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
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
    newPassword: string
    confirmPassword: string
}

const validationSchema = z
    .object({
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

    const uniquePart =
        searchParams.get('unique_part') || searchParams.get('uniquePart') || ''
    const code = searchParams.get('code') || ''
    const hasResetParams = Boolean(uniquePart && code)

    const {
        handleSubmit,
        formState: { errors },
        control,
        watch,
    } = useForm<ResetPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
        mode: 'onChange',
    })

    const onResetPassword = async (values: ResetPasswordFormSchema) => {
        if (!hasResetParams) {
            setMessage(
                'Ссылка для сброса пароля недействительна или устарела',
            )
            return
        }

        setSubmitting(true)
        setMessage('')

        try {
            await apiResetPassword({
                password: values.newPassword,
                password_confirmation: values.confirmPassword,
                unique_part: uniquePart,
                code,
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
                            Придумайте новый пароль для входа в аккаунт
                        </p>
                    </>
                )}
            </div>

            {message ? (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            ) : null}

            {!resetComplete && !hasResetParams ? (
                <>
                    <Alert showIcon className="mb-4" type="danger">
                        Ссылка для сброса пароля недействительна или устарела.
                        Запросите восстановление ещё раз.
                    </Alert>
                    <Button
                        block
                        variant="solid"
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                    >
                        Восстановить пароль
                    </Button>
                </>
            ) : null}

            {!resetComplete && hasResetParams ? (
                <Form onSubmit={handleSubmit(onResetPassword)}>
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
                            (watch('newPassword') || '').length < 8 ||
                            watch('newPassword') !== watch('confirmPassword')
                        }
                    >
                        Сохранить пароль
                    </Button>
                </Form>
            ) : null}

            {resetComplete ? (
                <Button
                    block
                    variant="solid"
                    type="button"
                    onClick={() => navigate(signInUrl)}
                >
                    Войти
                </Button>
            ) : null}

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
