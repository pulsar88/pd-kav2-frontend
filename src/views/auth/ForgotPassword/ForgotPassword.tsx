import { useState } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem, Form } from '@/components/ui/Form'
import ActionLink from '@/components/shared/ActionLink'
import { apiForgotPassword } from '@/services/AuthService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

type ForgotPasswordProps = {
    signInUrl?: string
}

type EmailSchema = {
    email: string
}

const emailSchema = z.object({
    email: z.string().email('Введите корректный email'),
})

export const ForgotPasswordBase = ({
    signInUrl = '/sign-in',
}: ForgotPasswordProps) => {
    const [requestSent, setRequestSent] = useState(false)
    const [isSubmitting, setSubmitting] = useState(false)
    const [message, setMessage] = useTimeOutMessage()

    const {
        handleSubmit,
        formState: { errors, isValid },
        control,
    } = useForm<EmailSchema>({
        defaultValues: { email: '' },
        resolver: zodResolver(emailSchema),
        mode: 'onChange',
    })

    const handleEmailSubmit = async (values: EmailSchema) => {
        setSubmitting(true)
        setMessage('')

        try {
            await apiForgotPassword({
                email: values.email.trim(),
                channel: 'EMAIL',
            })
            setRequestSent(true)
        } catch (errors) {
            setMessage(
                getApiErrorMessage(
                    errors,
                    'Не удалось отправить заявку на восстановление',
                ),
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                {requestSent ? (
                    <>
                        <h2 className="mb-2">Заявка отправлена</h2>
                        <p className="font-semibold heading-text">
                            Если аккаунт с таким email существует, мы отправим
                            ссылку для восстановления пароля
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="mb-2">Восстановление пароля</h2>
                        <p className="font-semibold heading-text">
                            Укажите email аккаунта — мы отправим ссылку для
                            сброса пароля
                        </p>
                    </>
                )}
            </div>

            {message && !requestSent ? (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            ) : null}

            {requestSent ? (
                <Alert showIcon className="mb-4" type="success">
                    Заявка на восстановление пароля отправлена. Проверьте
                    почту и перейдите по ссылке из письма.
                </Alert>
            ) : (
                <Form onSubmit={handleSubmit(handleEmailSubmit)}>
                    <FormItem
                        asterisk
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
                                    type="email"
                                    placeholder="name@example.com"
                                    autoComplete="email"
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
                        disabled={!isValid}
                    >
                        Восстановить пароль
                    </Button>
                </Form>
            )}

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
        </div>
    )
}

const ForgotPassword = () => {
    return <ForgotPasswordBase />
}

export default ForgotPassword
