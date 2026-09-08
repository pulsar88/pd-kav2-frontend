import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import classNames from '@/utils/classNames'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { FormItem, Form } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import PasswordInput from '@/components/shared/PasswordInput'
import PhoneInput from '@/components/shared/PhoneInput'
import OtpInput from '@/components/shared/OtpInput'
import { useAuth } from '@/auth'
import { toAuthPhonePayload } from '@/services/auth/authUtils'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TbBuildingSkyscraper, TbUser } from 'react-icons/tb'
import {
    formatRuPhone,
    RU_PHONE_REGEX,
} from '@/views/fixations/utils'
import type { CommonProps } from '@/@types/common'

type AuthStep =
    | 'phone'
    | 'login-password'
    | 'login-otp'
    | 'register-role'
    | 'register-password'
    | 'register-otp'

type RegisterRole = 'agent' | 'agency'

interface SignInFormProps extends CommonProps {
    disableSubmit?: boolean
    setMessage?: (message: string) => void
}

type PhoneSchema = {
    phone: string
    personalDataConsent: boolean
    termsAccepted: boolean
}

type PasswordSchema = {
    password: string
}

type RegisterPasswordSchema = {
    name: string
    password: string
    confirmPassword: string
    isAgency: boolean
    agencyName: string
    agencyPhone: string
}

type OtpSchema = {
    code: string
}

const OTP_LENGTH = 4
const OTP_RESEND_COOLDOWN_SEC = 60

const registerRoleOptions: Array<{
    value: RegisterRole
    title: string
    description: string
    icon: typeof TbUser
}> = [
    {
        value: 'agent',
        title: 'Агент',
        description: 'Работаю самостоятельно или в агентстве как риелтор',
        icon: TbUser,
    },
    {
        value: 'agency',
        title: 'Руководитель агентства',
        description: 'Регистрирую агентство и управляю командой',
        icon: TbBuildingSkyscraper,
    },
]

const showAuthSuccessToast = () => {
    toast.push(
        <Notification type="success">Вход выполнен успешно</Notification>,
        { placement: 'top-end' },
    )
}

const formatResendCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const phoneSchema = z.object({
    phone: z
        .string()
        .regex(RU_PHONE_REGEX, {
            message: 'Введите номер в формате +7 9XX XXX XX XX',
        }),
    personalDataConsent: z
        .boolean()
        .refine((value) => value, {
            message: 'Необходимо согласие на обработку персональных данных',
        }),
    termsAccepted: z.boolean().refine((value) => value, {
        message: 'Необходимо принять пользовательское соглашение',
    }),
})

const passwordSchema = z.object({
    password: z
        .string()
        .min(8, { message: 'Минимум 8 символов' })
        .regex(/^\S+$/, { message: 'Пароль не должен содержать пробелы' }),
})

const registerPasswordSchema = z
    .object({
        name: z.string().trim().min(2, { message: 'Укажите имя' }),
        password: z
            .string()
            .min(8, { message: 'Минимум 8 символов' })
            .regex(/^\S+$/, { message: 'Пароль не должен содержать пробелы' }),
        confirmPassword: z.string().min(1, { message: 'Повторите пароль' }),
        isAgency: z.boolean(),
        agencyName: z.string(),
        agencyPhone: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    })
    .superRefine((data, ctx) => {
        if (!data.isAgency) return

        if (!data.agencyName.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Укажите название агентства',
                path: ['agencyName'],
            })
        }

        if (!RU_PHONE_REGEX.test(data.agencyPhone)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Введите телефон агентства',
                path: ['agencyPhone'],
            })
        }
    })

const otpSchema = z.object({
    code: z
        .string()
        .length(OTP_LENGTH, { message: `Введите код из ${OTP_LENGTH} цифр` }),
})

const stepTitle: Record<AuthStep, { title: string; description: string }> = {
    phone: {
        title: 'Вход',
        description: 'Введите номер телефона, чтобы войти или зарегистрироваться',
    },
    'login-password': {
        title: 'Вход',
        description: 'Введите пароль от вашего аккаунта',
    },
    'login-otp': {
        title: 'Вход по коду',
        description: 'Введите код из SMS',
    },
    'register-role': {
        title: 'Регистрация',
        description: 'Выберите, как вы хотите зарегистрироваться',
    },
    'register-password': {
        title: 'Регистрация',
        description: 'Заполните данные и придумайте пароль',
    },
    'register-otp': {
        title: 'Подтверждение',
        description: 'Введите код из SMS, чтобы завершить регистрацию',
    },
}

const SignInForm = (props: SignInFormProps) => {
    const { disableSubmit = false, className, setMessage } = props
    const [step, setStep] = useState<AuthStep>('phone')
    const [phone, setPhone] = useState('')
    const [registerRole, setRegisterRole] = useState<RegisterRole | null>(null)
    const [registerDraft, setRegisterDraft] = useState<RegisterPasswordSchema | null>(
        null,
    )
    const [otpUniquePart, setOtpUniquePart] = useState('')
    const [isSubmitting, setSubmitting] = useState(false)
    const [highlightConsents, setHighlightConsents] = useState(false)
    const [otpResendAvailableAt, setOtpResendAvailableAt] = useState(0)
    const [otpResendSecondsLeft, setOtpResendSecondsLeft] = useState(0)
    const [loginOtpSent, setLoginOtpSent] = useState(false)

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

    const markOtpSent = () => {
        setOtpResendAvailableAt(Date.now() + OTP_RESEND_COOLDOWN_SEC * 1000)
    }

    const resetLoginOtpSession = () => {
        setLoginOtpSent(false)
        setOtpResendAvailableAt(0)
        setOtpUniquePart('')
        otpForm.reset({ code: '' })
    }

    const {
        checkPhone,
        signIn,
        sendOtp,
        signInWithOtp,
        signUpWithPhone,
    } = useAuth()

    const phoneForm = useForm<PhoneSchema>({
        defaultValues: {
            phone: '',
            personalDataConsent: false,
            termsAccepted: false,
        },
        resolver: zodResolver(phoneSchema),
        mode: 'onChange',
    })

    const loginPasswordForm = useForm<PasswordSchema>({
        defaultValues: { password: '' },
        resolver: zodResolver(passwordSchema),
        mode: 'onChange',
    })

    const registerPasswordForm = useForm<RegisterPasswordSchema>({
        defaultValues: {
            name: '',
            password: '',
            confirmPassword: '',
            isAgency: false,
            agencyName: '',
            agencyPhone: '',
        },
        resolver: zodResolver(registerPasswordSchema),
        mode: 'onChange',
    })

    const otpForm = useForm<OtpSchema>({
        defaultValues: { code: '' },
        resolver: zodResolver(otpSchema),
    })

    const resetRegisterFlow = () => {
        setRegisterRole(null)
        setRegisterDraft(null)
        registerPasswordForm.reset({
            name: '',
            password: '',
            confirmPassword: '',
            isAgency: false,
            agencyName: '',
            agencyPhone: '',
        })
    }

    const goToPhoneStep = () => {
        setMessage?.('')
        setHighlightConsents(false)
        resetLoginOtpSession()
        resetRegisterFlow()
        phoneForm.setValue('phone', phone)
        setStep('phone')
    }

    const isAgency = registerRole === 'agency'
    const meta = useMemo(() => {
        if (step === 'register-password') {
            return isAgency
                ? {
                      title: 'Регистрация агентства',
                      description:
                          'Укажите данные руководителя и агентства, затем придумайте пароль',
                  }
                : {
                      title: 'Регистрация агента',
                      description: 'Укажите имя и придумайте пароль для аккаунта',
                  }
        }
        if (step === 'register-otp') {
            return isAgency
                ? {
                      title: 'Подтверждение',
                      description:
                          'Введите код из SMS, чтобы завершить регистрацию агентства',
                  }
                : stepTitle['register-otp']
        }
        return stepTitle[step]
    }, [isAgency, step])

    const selectRegisterRole = (role: RegisterRole) => {
        setMessage?.('')
        setRegisterRole(role)
        registerPasswordForm.setValue('isAgency', role === 'agency')
        if (role === 'agent') {
            registerPasswordForm.setValue('agencyName', '')
            registerPasswordForm.setValue('agencyPhone', '')
            registerPasswordForm.clearErrors(['agencyName', 'agencyPhone'])
        }
        setStep('register-password')
    }

    const goBack = () => {
        setMessage?.('')
        otpForm.reset({ code: '' })

        if (step === 'login-password') {
            resetLoginOtpSession()
            setHighlightConsents(false)
            setStep('phone')
            return
        }
        if (step === 'login-otp') {
            setStep('login-password')
            return
        }
        if (step === 'register-role') {
            setHighlightConsents(false)
            resetRegisterFlow()
            setStep('phone')
            return
        }
        if (step === 'register-password') {
            setStep('register-role')
            return
        }
        if (step === 'register-otp') {
            setStep('register-password')
        }
    }

    const handlePhoneSubmit = async (values: PhoneSchema) => {
        if (disableSubmit) return
        setSubmitting(true)
        setMessage?.('')

        const result = await checkPhone(toAuthPhonePayload(values.phone))
        setSubmitting(false)

        if (result.status === 'failed') {
            setMessage?.(result.message)
            return
        }

        setPhone(values.phone)
        resetLoginOtpSession()

        if (result.registered) {
            loginPasswordForm.reset({ password: '' })
            setStep('login-password')
        } else {
            resetRegisterFlow()
            setStep('register-role')
        }
    }

    const handleLoginPassword = async (values: PasswordSchema) => {
        if (disableSubmit) return
        setSubmitting(true)
        setMessage?.('')

        const result = await signIn({
            ...toAuthPhonePayload(phone),
            password: values.password,
        })
        setSubmitting(false)

        if (result.status === 'failed') {
            setMessage?.(result.message)
            return
        }

        showAuthSuccessToast()
    }

    const handleSendLoginOtp = async () => {
        if (disableSubmit) return

        if (loginOtpSent && otpUniquePart) {
            setMessage?.('')
            otpForm.reset({ code: '' })
            setStep('login-otp')
            return
        }

        setSubmitting(true)
        setMessage?.('')

        const result = await sendOtp({
            ...toAuthPhonePayload(phone),
            purpose: 'login',
        })
        setSubmitting(false)

        if (result.status === 'failed') {
            setMessage?.(result.message)
            return
        }

        if (!result.uniquePart) {
            setMessage?.('Не удалось получить параметры подтверждения')
            return
        }

        setOtpUniquePart(result.uniquePart)
        markOtpSent()
        setLoginOtpSent(true)
        otpForm.reset({ code: '' })
        setStep('login-otp')
    }

    const handleLoginOtp = async (values: OtpSchema) => {
        if (disableSubmit) return
        setSubmitting(true)
        setMessage?.('')
        otpForm.clearErrors('code')

        const result = await signInWithOtp({
            ...toAuthPhonePayload(phone),
            code: values.code,
            unique_part: otpUniquePart,
        })
        setSubmitting(false)

        if (result.status === 'failed') {
            otpForm.setError('code', {
                type: 'server',
                message: result.message || 'Неверный код подтверждения',
            })
            return
        }

        showAuthSuccessToast()
    }

    const handleRegisterPassword = async (values: RegisterPasswordSchema) => {
        if (disableSubmit) return
        setSubmitting(true)
        setMessage?.('')

        const result = await sendOtp({
            ...toAuthPhonePayload(phone),
            purpose: 'register',
        })
        setSubmitting(false)

        if (result.status === 'failed') {
            setMessage?.(result.message)
            return
        }

        if (!result.uniquePart) {
            setMessage?.('Не удалось получить параметры подтверждения')
            return
        }

        setOtpUniquePart(result.uniquePart)
        markOtpSent()
        setRegisterDraft({
            ...values,
            isAgency: registerRole === 'agency',
        })
        otpForm.reset({ code: '' })
        setStep('register-otp')
    }

    const handleRegisterOtp = async (values: OtpSchema) => {
        if (disableSubmit || !registerDraft) return
        setSubmitting(true)
        setMessage?.('')
        otpForm.clearErrors('code')

        const phonePayload = toAuthPhonePayload(phone)
        const base = {
            ...phonePayload,
            name: registerDraft.name.trim(),
            password: registerDraft.password,
            code: values.code,
            unique_part: otpUniquePart,
        }

        const result = await signUpWithPhone(
            registerDraft.isAgency
                ? {
                      ...base,
                      agency: {
                          ...toAuthPhonePayload(registerDraft.agencyPhone),
                          name: registerDraft.agencyName.trim(),
                      },
                  }
                : base,
        )
        setSubmitting(false)

        if (result.status === 'failed') {
            otpForm.setError('code', {
                type: 'server',
                message: result.message || 'Неверный код подтверждения',
            })
            return
        }

        showAuthSuccessToast()
    }

    const handleResendOtp = async () => {
        if (otpResendSecondsLeft > 0) return

        setSubmitting(true)
        setMessage?.('')
        const purpose = step === 'register-otp' ? 'register' : 'login'
        const result = await sendOtp({
            ...toAuthPhonePayload(phone),
            purpose,
        })
        setSubmitting(false)

        if (result.status === 'failed') {
            setMessage?.(result.message)
            return
        }

        if (!result.uniquePart) {
            setMessage?.('Не удалось получить параметры подтверждения')
            return
        }

        setOtpUniquePart(result.uniquePart)
        markOtpSent()
        otpForm.reset({ code: '' })
        otpForm.clearErrors('code')
    }

    return (
        <div className={className}>
            <div className="mb-8">
                <h2 className="mb-2">{meta.title}</h2>
                <p className="font-semibold heading-text">{meta.description}</p>
                {phone && step !== 'phone' ? (
                    <p className="mt-3 text-xl font-bold tracking-wide text-primary">
                        {formatRuPhone(phone) || phone}
                    </p>
                ) : null}
            </div>

            {step === 'phone' ? (
                <Form
                    onSubmit={phoneForm.handleSubmit(
                        handlePhoneSubmit,
                        () => setHighlightConsents(true),
                    )}
                >
                    <FormItem
                        asterisk
                        label="Телефон"
                        errorMode="reserved"
                        invalid={Boolean(phoneForm.formState.errors.phone)}
                        errorMessage={
                            phoneForm.formState.errors.phone?.message
                        }
                    >
                        <Controller
                            name="phone"
                            control={phoneForm.control}
                            render={({ field }) => (
                                <PhoneInput
                                    value={field.value ?? ''}
                                    onBlur={field.onBlur}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        errorMode="none"
                        invalid={
                            highlightConsents &&
                            !phoneForm.watch('personalDataConsent')
                        }
                    >
                        <Controller
                            name="personalDataConsent"
                            control={phoneForm.control}
                            render={({ field }) => (
                                <Checkbox
                                    checked={field.value}
                                    checkboxClass={
                                        highlightConsents && !field.value
                                            ? 'text-error ring-error border-error'
                                            : undefined
                                    }
                                    onChange={(checked) => {
                                        const next = Boolean(checked)
                                        field.onChange(next)
                                        if (
                                            next &&
                                            phoneForm.getValues('termsAccepted')
                                        ) {
                                            setHighlightConsents(false)
                                        }
                                    }}
                                >
                                    Даю согласие на обработку своих
                                    персональных данных
                                </Checkbox>
                            )}
                        />
                    </FormItem>

                    <FormItem
                        className="!mb-6"
                        errorMode="none"
                        invalid={
                            highlightConsents &&
                            !phoneForm.watch('termsAccepted')
                        }
                    >
                        <Controller
                            name="termsAccepted"
                            control={phoneForm.control}
                            render={({ field }) => (
                                <Checkbox
                                    checked={field.value}
                                    checkboxClass={
                                        highlightConsents && !field.value
                                            ? 'text-error ring-error border-error'
                                            : undefined
                                    }
                                    onChange={(checked) => {
                                        const next = Boolean(checked)
                                        field.onChange(next)
                                        if (
                                            next &&
                                            phoneForm.getValues(
                                                'personalDataConsent',
                                            )
                                        ) {
                                            setHighlightConsents(false)
                                        }
                                    }}
                                >
                                    Я принимаю пользовательское соглашение
                                </Checkbox>
                            )}
                        />
                    </FormItem>

                    <Button
                        block
                        loading={isSubmitting}
                        variant="solid"
                        type="submit"
                        disabled={
                            !RU_PHONE_REGEX.test(
                                phoneForm.watch('phone') || '',
                            )
                        }
                    >
                        Войти
                    </Button>
                </Form>
            ) : null}

            {step === 'login-password' ? (
                <Form
                    onSubmit={loginPasswordForm.handleSubmit(
                        handleLoginPassword,
                    )}
                >
                    <FormItem
                        asterisk
                        label="Пароль"
                        errorMode="reserved"
                        invalid={Boolean(
                            loginPasswordForm.formState.errors.password,
                        )}
                        errorMessage={
                            loginPasswordForm.formState.errors.password
                                ?.message
                        }
                    >
                        <Controller
                            name="password"
                            control={loginPasswordForm.control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="current-password"
                                    placeholder="Введите пароль"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="mb-4 flex flex-col items-center gap-2 text-center">
                        <button
                            type="button"
                            className="text-sm font-semibold text-primary hover:underline"
                            disabled={isSubmitting}
                            onClick={() => void handleSendLoginOtp()}
                        >
                            Войти по коду из SMS
                        </button>
                        <Link
                            to="/forgot-password"
                            className="text-sm text-gray-500 hover:text-primary hover:underline dark:text-gray-400"
                        >
                            Забыли пароль?
                        </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            block
                            loading={isSubmitting}
                            variant="solid"
                            type="submit"
                            disabled={
                                (loginPasswordForm.watch('password') || '')
                                    .length < 8
                            }
                        >
                            Войти
                        </Button>
                        <Button
                            block
                            variant="plain"
                            type="button"
                            onClick={goBack}
                        >
                            Изменить номер
                        </Button>
                    </div>
                </Form>
            ) : null}

            {step === 'login-otp' || step === 'register-otp' ? (
                <Form
                    onSubmit={otpForm.handleSubmit(
                        step === 'login-otp'
                            ? handleLoginOtp
                            : handleRegisterOtp,
                    )}
                >
                    <FormItem
                        className="!mb-6"
                        errorMode="reserved"
                        invalid={Boolean(otpForm.formState.errors.code)}
                        errorMessage={
                            otpForm.formState.errors.code?.message
                        }
                    >
                        <Controller
                            name="code"
                            control={otpForm.control}
                            render={({ field }) => (
                                <OtpInput
                                    placeholder=""
                                    inputClass="h-14"
                                    length={OTP_LENGTH}
                                    value={field.value}
                                    invalid={Boolean(
                                        otpForm.formState.errors.code,
                                    )}
                                    onChange={(value) => {
                                        field.onChange(value)
                                        if (otpForm.formState.errors.code) {
                                            otpForm.clearErrors('code')
                                        }
                                    }}
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
                                (otpForm.watch('code') || '').length <
                                OTP_LENGTH
                            }
                        >
                            Подтвердить
                        </Button>
                        <Button
                            block
                            type="button"
                            loading={isSubmitting}
                            disabled={otpResendSecondsLeft > 0}
                            onClick={() => void handleResendOtp()}
                        >
                            {otpResendSecondsLeft > 0
                                ? `Отправить код ещё раз через ${formatResendCountdown(otpResendSecondsLeft)}`
                                : 'Отправить код ещё раз'}
                        </Button>
                        {step === 'login-otp' ? (
                            <>
                                <Button
                                    block
                                    variant="plain"
                                    type="button"
                                    onClick={() => {
                                        setMessage?.('')
                                        otpForm.reset({ code: '' })
                                        setStep('login-password')
                                    }}
                                >
                                    Войти по паролю
                                </Button>
                                <Button
                                    block
                                    variant="plain"
                                    type="button"
                                    onClick={goToPhoneStep}
                                >
                                    Изменить номер
                                </Button>
                            </>
                        ) : (
                            <Button
                                block
                                variant="plain"
                                type="button"
                                onClick={goBack}
                            >
                                Назад
                            </Button>
                        )}
                    </div>
                </Form>
            ) : null}

            {step === 'register-role' ? (
                <div className="flex flex-col gap-3">
                    {registerRoleOptions.map((option) => {
                        const Icon = option.icon
                        const selected = registerRole === option.value

                        return (
                            <button
                                key={option.value}
                                type="button"
                                className={classNames(
                                    'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                                    selected
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60',
                                )}
                                onClick={() => selectRegisterRole(option.value)}
                            >
                                <span
                                    className={classNames(
                                        'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                                        selected
                                            ? 'bg-primary text-neutral'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200',
                                    )}
                                >
                                    <Icon className="text-xl" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-base font-semibold text-gray-900 dark:text-gray-100">
                                        {option.title}
                                    </span>
                                    <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                                        {option.description}
                                    </span>
                                </span>
                            </button>
                        )
                    })}
                    <Button
                        block
                        variant="plain"
                        type="button"
                        className="mt-2"
                        onClick={goBack}
                    >
                        Изменить номер
                    </Button>
                </div>
            ) : null}

            {step === 'register-password' ? (
                <Form
                    onSubmit={registerPasswordForm.handleSubmit(
                        handleRegisterPassword,
                    )}
                >
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/60">
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Тип регистрации
                            </p>
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {isAgency
                                    ? 'Руководитель агентства'
                                    : 'Агент'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 text-sm font-semibold text-primary hover:underline"
                            onClick={() => setStep('register-role')}
                        >
                            Изменить
                        </button>
                    </div>

                    <FormItem
                        asterisk
                        label={isAgency ? 'Имя руководителя' : 'Имя'}
                        errorMode="reserved"
                        invalid={Boolean(
                            registerPasswordForm.formState.errors.name,
                        )}
                        errorMessage={
                            registerPasswordForm.formState.errors.name?.message
                        }
                    >
                        <Controller
                            name="name"
                            control={registerPasswordForm.control}
                            render={({ field }) => (
                                <Input
                                    autoComplete="name"
                                    placeholder="Введите имя"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {isAgency ? (
                        <>
                            <FormItem
                                asterisk
                                label="Название агентства"
                                errorMode="reserved"
                                invalid={Boolean(
                                    registerPasswordForm.formState.errors
                                        .agencyName,
                                )}
                                errorMessage={
                                    registerPasswordForm.formState.errors
                                        .agencyName?.message
                                }
                            >
                                <Controller
                                    name="agencyName"
                                    control={registerPasswordForm.control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Введите название агентства"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                            <FormItem
                                asterisk
                                label="Телефон агентства"
                                errorMode="reserved"
                                invalid={Boolean(
                                    registerPasswordForm.formState.errors
                                        .agencyPhone,
                                )}
                                errorMessage={
                                    registerPasswordForm.formState.errors
                                        .agencyPhone?.message
                                }
                            >
                                <Controller
                                    name="agencyPhone"
                                    control={registerPasswordForm.control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            value={field.value ?? ''}
                                            onBlur={field.onBlur}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </FormItem>
                        </>
                    ) : null}

                    <FormItem
                        asterisk
                        label="Пароль"
                        errorMode="reserved"
                        invalid={Boolean(
                            registerPasswordForm.formState.errors.password,
                        )}
                        errorMessage={
                            registerPasswordForm.formState.errors.password
                                ?.message
                        }
                    >
                        <Controller
                            name="password"
                            control={registerPasswordForm.control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Придумайте пароль"
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e)
                                        if (
                                            registerPasswordForm.getValues(
                                                'confirmPassword',
                                            )
                                        ) {
                                            registerPasswordForm.trigger(
                                                'confirmPassword',
                                            )
                                        }
                                    }}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        asterisk
                        label="Подтверждение пароля"
                        errorMode="reserved"
                        invalid={Boolean(
                            registerPasswordForm.formState.errors
                                .confirmPassword,
                        )}
                        errorMessage={
                            registerPasswordForm.formState.errors
                                .confirmPassword?.message
                        }
                    >
                        <Controller
                            name="confirmPassword"
                            control={registerPasswordForm.control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Повторите пароль"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <div className="mt-2 flex flex-col gap-2">
                        <Button
                            block
                            loading={isSubmitting}
                            variant="solid"
                            type="submit"
                            disabled={
                                (registerPasswordForm.watch('name') || '')
                                    .trim().length < 2 ||
                                (registerPasswordForm.watch('password') || '')
                                    .length < 8 ||
                                !(
                                    registerPasswordForm.watch(
                                        'confirmPassword',
                                    ) || ''
                                ) ||
                                registerPasswordForm.watch('password') !==
                                    registerPasswordForm.watch(
                                        'confirmPassword',
                                    ) ||
                                (isAgency &&
                                    (!(
                                        registerPasswordForm.watch(
                                            'agencyName',
                                        ) || ''
                                    ).trim() ||
                                        !RU_PHONE_REGEX.test(
                                            registerPasswordForm.watch(
                                                'agencyPhone',
                                            ) || '',
                                        )))
                            }
                        >
                            Продолжить
                        </Button>
                        <Button
                            block
                            variant="plain"
                            type="button"
                            onClick={goBack}
                        >
                            Назад
                        </Button>
                    </div>
                </Form>
            ) : null}
        </div>
    )
}

export default SignInForm
