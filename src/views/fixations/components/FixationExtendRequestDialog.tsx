import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Fixation } from '../types'

export type FixationExtendRequestValues = {
    extendDays: number
    comment: string
}

type FixationExtendRequestDialogProps = {
    isOpen: boolean
    fixation: Fixation | null
    isSubmitting?: boolean
    onClose: () => void
    onSubmit: (values: FixationExtendRequestValues) => void | Promise<void>
}

type ExtendFormSchema = {
    extendDays: number
    comment: string
}

const extendSchema = z.object({
    extendDays: z.coerce
        .number({ message: 'Укажите количество дней' })
        .int({ message: 'Укажите целое число дней' })
        .min(1, { message: 'Минимум 1 день' }),
    comment: z
        .string()
        .trim()
        .min(1, { message: 'Введите комментарий' }),
})

const defaultValues: ExtendFormSchema = {
    extendDays: 7,
    comment: '',
}

const FixationExtendRequestDialog = ({
    isOpen,
    fixation,
    isSubmitting = false,
    onClose,
    onSubmit,
}: FixationExtendRequestDialogProps) => {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<ExtendFormSchema>({
        defaultValues,
        resolver: zodResolver(extendSchema),
        mode: 'onChange',
    })

    useEffect(() => {
        if (!isOpen) return
        reset(defaultValues)
    }, [isOpen, fixation?.id, reset])

    const handleClose = () => {
        if (isSubmitting) return
        onClose()
    }

    const handleFormSubmit = async (values: ExtendFormSchema) => {
        await onSubmit({
            extendDays: values.extendDays,
            comment: values.comment.trim(),
        })
    }

    return (
        <Dialog
            isOpen={isOpen}
            width={520}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <h4 className="mb-1">Заявка на продление фиксации</h4>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {fixation
                    ? `${fixation.fullName} · ${fixation.phone}`
                    : 'Фиксация'}
            </p>

            <Form onSubmit={handleSubmit(handleFormSubmit)}>
                <FormItem
                    label="На сколько дней продлить"
                    asterisk
                    invalid={Boolean(errors.extendDays)}
                    errorMessage={errors.extendDays?.message}
                >
                    <Controller
                        name="extendDays"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="number"
                                min={1}
                                className="[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                value={field.value}
                                onBlur={field.onBlur}
                                onChange={(e) =>
                                    field.onChange(
                                        e.target.value === ''
                                            ? ''
                                            : Number(e.target.value),
                                    )
                                }
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Комментарий"
                    asterisk
                    invalid={Boolean(errors.comment)}
                    errorMessage={errors.comment?.message}
                >
                    <Controller
                        name="comment"
                        control={control}
                        render={({ field }) => (
                            <Input
                                textArea
                                rows={4}
                                placeholder="Причина продления"
                                className="max-h-48 resize-y"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <div className="mt-2 flex justify-end gap-2">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleClose}
                    >
                        Отмена
                    </Button>
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                        disabled={!isValid}
                    >
                        Создать заявку
                    </Button>
                </div>
            </Form>
        </Dialog>
    )
}

export default FixationExtendRequestDialog
