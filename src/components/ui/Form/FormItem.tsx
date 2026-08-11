import classNames from '../utils/classNames'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, FormItemContextProvider } from './context'
import { useConfig } from '../ConfigProvider'
import { CONTROL_SIZES, LAYOUT } from '../utils/constants'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type { ReactNode, Ref } from 'react'

export interface FormItemProps extends CommonProps {
    asterisk?: boolean
    errorMessage?: string
    /** animated — с анимацией; reserved — всегда слот без анимации; none — только invalid-состояние */
    errorMode?: 'animated' | 'reserved' | 'none'
    extra?: string | ReactNode
    htmlFor?: string
    invalid?: boolean
    label?: string
    labelClass?: string
    labelWidth?: string | number
    layout?: TypeAttributes.FormLayout
    ref?: Ref<HTMLDivElement>
    size?: TypeAttributes.ControlSize
}

const FormItem = (props: FormItemProps) => {
    const {
        asterisk,
        children,
        className,
        errorMessage,
        errorMode = 'animated',
        extra,
        htmlFor,
        invalid,
        label,
        labelClass,
        labelWidth,
        layout,
        ref,
        style,
        size,
    } = props

    const formContext = useForm()
    const { controlSize } = useConfig()

    const formItemLabelHeight = size || formContext?.size || controlSize
    const formItemLabelWidth = labelWidth || formContext?.labelWidth
    const formItemLayout = layout || formContext?.layout || 'vertical'

    const getFormLabelLayoutClass = () => {
        switch (formItemLayout) {
            case LAYOUT.HORIZONTAL:
                return label
                    ? `${CONTROL_SIZES[formItemLabelHeight].h} ${
                          label && 'ltr:pr-2 rtl:pl-2'
                      }`
                    : 'ltr:pr-2 rtl:pl-2'
            case LAYOUT.VERTICAL:
                return `mb-2`
            case LAYOUT.INLINE:
                return `${CONTROL_SIZES[formItemLabelHeight].h} ${
                    label && 'ltr:pr-2 rtl:pl-2'
                }`
            default:
                return ''
        }
    }

    const formItemClass = classNames(
        'form-item',
        formItemLayout,
        className,
        invalid ? 'invalid' : '',
    )

    const formLabelClass = classNames(
        'form-label',
        label && getFormLabelLayoutClass(),
        labelClass,
    )

    const formLabelStyle = () => {
        if (formItemLayout === LAYOUT.HORIZONTAL) {
            return { ...style, ...{ minWidth: formItemLabelWidth } }
        }

        return { ...style }
    }

    const enterStyle = { opacity: 1, marginTop: 3 }
    const exitStyle = { opacity: 0, marginTop: 0 }
    const initialStyle = exitStyle

    const renderError = () => {
        if (errorMode === 'none') {
            return null
        }

        if (errorMode === 'reserved') {
            return (
                <div
                    className="relative mt-[3px] min-h-5 overflow-hidden"
                    aria-live="polite"
                >
                    <AnimatePresence initial={false}>
                        {invalid && errorMessage ? (
                            <motion.div
                                key={errorMessage}
                                className="form-explain absolute inset-x-0 top-0"
                                initial={{ opacity: 0, y: '-100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '-100%' }}
                                transition={{ duration: 0.2, type: 'tween' }}
                            >
                                {errorMessage}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            )
        }

        return (
            <AnimatePresence mode="wait">
                {invalid && (
                    <motion.div
                        className="form-explain"
                        initial={initialStyle}
                        animate={enterStyle}
                        exit={exitStyle}
                        transition={{ duration: 0.15, type: 'tween' }}
                    >
                        {errorMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        )
    }

    return (
        <FormItemContextProvider value={{ invalid }}>
            <div ref={ref} className={formItemClass}>
                <label
                    htmlFor={htmlFor}
                    className={formLabelClass}
                    style={formLabelStyle()}
                >
                    {asterisk && (
                        <span className="text-red-500 ltr:mr-1 rtl:ml-1">
                            *
                        </span>
                    )}
                    {label}
                    {extra && <span>{extra}</span>}
                    {label && formItemLayout !== 'vertical' && ':'}
                </label>
                <div
                    className={
                        formItemLayout === LAYOUT.HORIZONTAL
                            ? 'w-full flex flex-col justify-center relative'
                            : ''
                    }
                >
                    {children}
                    {renderError()}
                </div>
            </div>
        </FormItemContextProvider>
    )
}

export default FormItem
