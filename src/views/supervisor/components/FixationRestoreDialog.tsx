import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Fixation } from '@/views/fixations/types'
import { getFixationStatusDisplay } from '@/views/fixations/utils'
import { apiGetAmoStatuses, type AmoStatus } from '@/services/FixationsService'
import { TbRotateClockwise, TbUser, TbBuilding, TbPhone } from 'react-icons/tb'

export type FixationRestoreValues = {
    amocrm_status_id: number
    fixed_till: number
}

type FixationRestoreDialogProps = {
    isOpen: boolean
    fixation: Fixation | null
    isSubmitting?: boolean
    onClose: () => void
    onSubmit: (values: FixationRestoreValues) => void | Promise<void>
}

type RestoreFormSchema = {
    amocrm_status_id: number | string
    fixed_till: number | string
}

type AmoStatusOption = {
    value: number
    label: string
    color?: string
}

const restoreSchema = z.object({
    amocrm_status_id: z.coerce
        .number({ message: 'Выберите статус в AmoCRM' })
        .int({ message: 'Выберите статус в AmoCRM' })
        .min(1, { message: 'Выберите статус в AmoCRM' }),
    fixed_till: z.coerce
        .number({ message: 'Укажите срок фиксации' })
        .int({ message: 'Срок должен быть целым числом' })
        .min(1, { message: 'Срок должен быть не менее 1 дня' }),
})

const defaultValues: RestoreFormSchema = {
    amocrm_status_id: '',
    fixed_till: 1,
}

const FixationRestoreDialog = ({
    isOpen,
    fixation,
    isSubmitting = false,
    onClose,
    onSubmit,
}: FixationRestoreDialogProps) => {
    const [amoStatuses, setAmoStatuses] = useState<AmoStatus[]>([])
    const [isLoadingStatuses, setIsLoadingStatuses] = useState(false)

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isValid },
    } = useForm<RestoreFormSchema>({
        defaultValues,
        resolver: zodResolver(restoreSchema),
        mode: 'onChange',
    })

    useEffect(() => {
        if (!isOpen) return

        let cancelled = false
        setIsLoadingStatuses(true)

        void apiGetAmoStatuses()
            .then((statuses) => {
                if (!cancelled) {
                    setAmoStatuses(statuses)
                    if (statuses.length > 0) {
                        setValue('amocrm_status_id', statuses[0].id, {
                            shouldValidate: true,
                        })
                    }
                }
            })
            .catch(() => {
                if (!cancelled) setAmoStatuses([])
            })
            .finally(() => {
                if (!cancelled) setIsLoadingStatuses(false)
            })

        reset({
            amocrm_status_id: '',
            fixed_till: 1,
        })

        return () => {
            cancelled = true
        }
    }, [isOpen, fixation?.id, reset, setValue])

    const handleClose = () => {
        if (isSubmitting) return
        onClose()
    }

    const handleFormSubmit = async (values: RestoreFormSchema) => {
        await onSubmit({
            amocrm_status_id: Number(values.amocrm_status_id),
            fixed_till: Number(values.fixed_till),
        })
    }

    const statusOptions: AmoStatusOption[] = amoStatuses.map((st) => ({
        value: st.id,
        label: st.name,
        color: st.color,
    }))

    const statusDisplay = fixation ? getFixationStatusDisplay(fixation) : null

    return (
        <Dialog
            isOpen={isOpen}
            width={520}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary text-xl">
                    <TbRotateClockwise />
                </div>
                <div>
                    <h4 className="text-lg font-bold">Восстановление фиксации</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Восстановить фиксацию в AmoCRM и в системе
                    </p>
                </div>
            </div>

            {fixation && (
                <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-700 dark:bg-gray-800/40 text-sm space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100 truncate">
                            <TbUser className="shrink-0 text-gray-400 text-base" />
                            <span className="truncate">{fixation.fullName}</span>
                        </div>
                        {statusDisplay && (
                            <span
                                className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${statusDisplay.className}`}
                            >
                                {statusDisplay.label}
                            </span>
                        )}
                    </div>
                    {fixation.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <TbPhone className="shrink-0 text-gray-400" />
                            <span>{fixation.phone}</span>
                        </div>
                    )}
                    {fixation.projectName && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 truncate">
                            <TbBuilding className="shrink-0 text-gray-400" />
                            <span className="truncate">
                                {fixation.projectName}
                                {fixation.apartment ? `, кв. ${fixation.apartment}` : ''}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <Form onSubmit={handleSubmit(handleFormSubmit)}>
                <FormItem
                    label="Статус в AmoCRM"
                    asterisk
                    invalid={Boolean(errors.amocrm_status_id)}
                    errorMessage={errors.amocrm_status_id?.message}
                >
                    <Controller
                        name="amocrm_status_id"
                        control={control}
                        render={({ field }) => (
                            <Select<AmoStatusOption>
                                options={statusOptions}
                                value={
                                    statusOptions.find(
                                        (opt) => opt.value === field.value,
                                    ) || null
                                }
                                onChange={(opt) =>
                                    field.onChange(opt ? opt.value : '')
                                }
                                placeholder="Выберите статус..."
                                isLoading={isLoadingStatuses}
                                formatOptionLabel={(option) => (
                                    <div className="flex items-center gap-2">
                                        {option.color && (
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{
                                                    backgroundColor:
                                                        option.color,
                                                }}
                                            />
                                        )}
                                        <span>{option.label}</span>
                                    </div>
                                )}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Срок фиксации"
                    asterisk
                    invalid={Boolean(errors.fixed_till)}
                    errorMessage={errors.fixed_till?.message}
                >
                    <Controller
                        name="fixed_till"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="number"
                                min={1}
                                placeholder="1"
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

                <div className="mt-6 flex justify-end gap-2">
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
                        icon={<TbRotateClockwise />}
                    >
                        Восстановить
                    </Button>
                </div>
            </Form>
        </Dialog>
    )
}

export default FixationRestoreDialog
