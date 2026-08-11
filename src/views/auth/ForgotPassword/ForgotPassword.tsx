import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import OtpInput from '@/components/shared/OtpInput'
import ActionLink from '@/components/shared/ActionLink'
import {
    apiForgotPassword,
    apiResetPassword,
} from '@/services/AuthService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

type ForgotPasswordProps = {
    signInUrl?: string
}

type ForgotStep = 'email' | 'code' | 'done'

type EmailSchema = {
    email: string
}

type ResetSchema = {
    code: string
    newPassword: string
    confirmPassword: string
}

const OTP_LENGTH = 4
const OTP_RESEND_COOLDOWN_SEC = 60

const emailSchema = z.object({
    email: z.string().email('Введите корректный email'),
})

const resetSchema = z
    .object({
        code: z
            .string()
            .length(OTP_LENGTH, {
                message: `Введите код из ${OTP_LENGTH} цифр`,
            }),
        newPassword: z
            .string()
            .min(8, { message: 'Минимум 8 символов' })
            .regex(/^\S+$/, { message: 'Пароль не должен содержать пробелы' }),
        confirmPassword: z.string().min(1, { message: 'Повторите пароль' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    })

const formatResendCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const extractUniquePart = (
    response: {
        unique_part?: string
        data?: { unique_part?: string }
        message?: string
    },
    email: string,
) =>
    response?.unique_part ||
    response?.data?.unique_part ||
    email

export const ForgotPasswordBase = ({
    signInUrl = '/sign-in',
}: ForgotPasswordProps) => {
    const [step, setStep] = useState<ForgotStep>('email')
    const [email, setEmail] = useState('')
    const [uniquePart, setUniquePart] = useState('')
    const [isSubmitting, setSubmitting] = useState(false)
    const [message, setMessage] = useTimeOutMessage()
    const [otpResendAvailableAt, setOtpResendAvailableAt] = useState(0)
    const [otpResendSecondsLeft, setOtpResendSecondsLeft] = useState(0)

    const navigate = useNavigate()

    const emailForm = useForm<EmailSchema>({
        defaultValues: { email: '' },
        resolver: zodResolver(emailSchema),
        mode: 'onChange',
    })

    const resetForm = useForm<ResetSchema>({
        defaultValues: { code: '', newPassword: '', confirmPassword: '' },
        resolver: zodResolver(resetSchema),
        mode: 'onChange',
    })

    useEffect(() => {
        if (!otpResendAvailableAt) {
            setOtpResendSecondsLeft(0)
            return
        }

        const tick = () => {
            const left = Math.max(
                0,
                Math.ceil((otpResendAvailableAt - Date.now()) / 1000),
            )
            setOtpResendSecondsLeft(left)
        }

        tick()
        const id = window.setInterval(tick, 250)
        return () => window.clearInterval(id)
    }, [otpResendAvailableAt])

    const meta = useMemo(() => {
        if (step === 'code') {
            return {
                title: 'Код подтверждения',
                description: `Мы отправили код на ${email}. Введите его и задайте новый пароль`,
            }
        }
        if (step === 'done') {
            return {
                title: 'Пароль обновлён',
                description: 'Теперь можно войти с новым паролем',
            }
        }
        return {
            title: 'Восстановление пароля',
            description:
                'Укажите email аккаунта — мы отправим код для сброса пароля',
        }
    }, [email, step])

    const markOtpSent = () => {
        setOtpResendAvailableAt(Date.now() + OTP_RESEND_COOLDOWN_SEC * 1000)
    }

    const sendResetCode = async (nextEmail: string) => {
        const response = await apiForgotPassword({
            email: nextEmail,
            channel: 'SMS',
        })

        setEmail(nextEmail)
        setUniquePart(extractUniquePart(response, nextEmail))
        markOtpSent()
        resetForm.reset({ code: '', newPassword: '', confirmPassword: '' })
        setStep('code')
    }

    const handleEmailSubmit = async (values: EmailSchema) => {
        setSubmitting(true)
        setMessage('')

        try {
            await sendResetCode(values.email.trim())
        } catch (errors) {
            setMessage(
                getApiErrorMessage(errors, 'Не удалось отправить код'),
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleResendCode = async () => {
        if (otpResendSecondsLeft > 0 || !email) return

        setSubmitting(true)
        setMessage('')

        try {
            await sendResetCode(email)
            resetForm.setValue('code', '')
            resetForm.clearErrors('code')
        } catch (errors) {
            setMessage(
                getApiErrorMessage(errors, 'Не удалось отправить код'),
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleResetSubmit = async (values: ResetSchema) => {
        setSubmitting(true)
        setMessage('')
        resetForm.clearErrors('code')

        try {
            await apiResetPassword({
                password: values.newPassword,
                password_confirmation: values.confirmPassword,
                unique_part: uniquePart,
                code: values.code,
            })
            setStep('done')
        } catch (errors) {
            const errorMessage = getApiErrorMessage(
                errors,
                'Не удалось сбросить пароль',
            )
            resetForm.setError('code', {
                type: 'server',
                message: errorMessage,
            })
            setMessage(errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h2 className="mb-2">{meta.title}</h2>
                <p className="font-semibold heading-text">{meta.description}</p>
            </div>

            {message && step !== 'done' ? (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            ) : null}

            {step === 'email' ? (
                <Form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
                    <FormItem
                        asterisk
                        label="Email"
                        errorMode="reserved"
                        invalid={Boolean(emailForm.formState.errors.email)}
                        errorMessage={emailForm.formState.errors.email?.message}
                    >
                        <Controller
                            name="email"
                            control={emailForm.control}
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
                        disabled={!emailForm.formState.isValid}
                    >
                        Отправить код
                    </Button>
                </Form>
            ) : null}

            {step === 'code' ? (
                <Form onSubmit={resetForm.handleSubmit(handleResetSubmit)}>
                    <FormItem
                        asterisk
                        label="Код из SMS"
                        errorMode="reserved"
                        invalid={Boolean(resetForm.formState.errors.code)}
                        errorMessage={resetForm.formState.errors.code?.message}
                    >
                        <Controller
                            name="code"
                            control={resetForm.control}
                            render={({ field }) => (
                                <OtpInput
                                    placeholder=""
                                    inputClass="h-14"
                                    length={OTP_LENGTH}
                                    value={field.value}
                                    invalid={Boolean(
                                        resetForm.formState.errors.code,
                                    )}
                                    onChange={(value) => {
                                        field.onChange(value)
                                        if (resetForm.formState.errors.code) {
                                            resetForm.clearErrors('code')
                                        }
                                    }}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        asterisk
                        label="Новый пароль"
                        errorMode="reserved"
                        invalid={Boolean(
                            resetForm.formState.errors.newPassword,
                        )}
                        errorMessage={
                            resetForm.formState.errors.newPassword?.message
                        }
                    >
                        <Controller
                            name="newPassword"
                            control={resetForm.control}
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
                        invalid={Boolean(
                            resetForm.formState.errors.confirmPassword,
                        )}
                        errorMessage={
                            resetForm.formState.errors.confirmPassword?.message
                        }
                    >
                        <Controller
                            name="confirmPassword"
                            control={resetForm.control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Повторите пароль"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <div className="flex flex-col gap-2">
                        <Button
                            block
                            loading={isSubmitting}
                            variant="solid"
                            type="submit"
                            disabled={
                                (resetForm.watch('code') || '').length <
                                    OTP_LENGTH ||
                                (resetForm.watch('newPassword') || '').length <
                                    8 ||
                                resetForm.watch('newPassword') !==
                                    resetForm.watch('confirmPassword')
                            }
                        >
                            Сохранить пароль
                        </Button>
                        <Button
                            block
                            type="button"
                            loading={isSubmitting}
                            disabled={otpResendSecondsLeft > 0}
                            onClick={() => void handleResendCode()}
                        >
                            {otpResendSecondsLeft > 0
                                ? `Отправить код ещё раз через ${formatResendCountdown(otpResendSecondsLeft)}`
                                : 'Отправить код ещё раз'}
                        </Button>
                        <Button
                            block
                            variant="plain"
                            type="button"
                            onClick={() => {
                                setMessage('')
                                setStep('email')
                            }}
                        >
                            Изменить email
                        </Button>
                    </div>
                </Form>
            ) : null}

            {step === 'done' ? (
                <Button
                    block
                    variant="solid"
                    type="button"
                    onClick={() => navigate(signInUrl)}
                >
                    Войти
                </Button>
            ) : null}

            {step !== 'done' ? (
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

const ForgotPassword = () => {
    return <ForgotPasswordBase />
}

export default ForgotPassword
