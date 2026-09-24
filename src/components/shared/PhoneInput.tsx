import type { ClipboardEvent } from 'react'
import classNames from '@/utils/classNames'
import Input from '@/components/ui/Input'
import { formatRuPhone, normalizeRuPhoneDigits } from '@/views/fixations/utils'

const formatNationalDisplay = (digits: string) => {
    const value = digits.slice(0, 10)
    if (!value) return '+7'

    return `+7 ${[
        value.slice(0, 3),
        value.slice(3, 6),
        value.slice(6, 8),
        value.slice(8, 10),
    ].filter(Boolean).join(' ')}`
}

const extractNationalDigits = (input: string): string => {
    const trimmed = input.trim()
    let digits = trimmed.replace(/\D/g, '')

    // Если вставили/ввели с префиксом 7, +7 или 8
    if (trimmed.startsWith('+7') || trimmed.startsWith('8')) {
        digits = digits.slice(1)
    } else if (digits.length >= 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
        digits = digits.slice(1)
    } else if (digits.length >= 11 && digits.startsWith('77')) {
        digits = digits.slice(2)
    } else if (digits.length >= 11 && digits.startsWith('78')) {
        digits = digits.slice(2)
    }

    // Если всё ещё больше 10 цифр и начинается с 7 или 8 (например из-за префикса инпута +7)
    if (digits.length > 10 && (digits.startsWith('7') || digits.startsWith('8'))) {
        digits = digits.slice(1)
    }

    digits = digits.slice(0, 10)
    if (digits.length > 0 && digits[0] !== '9') {
        return ''
    }
    return digits
}

export type PhoneInputProps = {
    value?: string
    className?: string
    disabled?: boolean
    invalid?: boolean
    countryCode?: string
    onBlur?: () => void
    onChange?: (formattedFullPhone: string) => void
    onCountryCodeChange?: (countryCode: string) => void
}

/** Российский телефон с фиксированным кодом +7 без отдельного выбора страны. */
const PhoneInput = ({
    value = '',
    className,
    disabled,
    invalid,
    onBlur,
    onChange,
}: PhoneInputProps) => {
    const nationalDigits = normalizeRuPhoneDigits(value).slice(0, 10)

    const handleChange = (raw: string) => {
        const digits = extractNationalDigits(raw)
        onChange?.(formatRuPhone(digits))
    }

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text')
        if (!text) return
        e.preventDefault()
        const digits = extractNationalDigits(text)
        onChange?.(formatRuPhone(digits))
    }

    return (
        <div
            className={classNames(
                'phone-input',
                invalid && 'phone-input-invalid',
                className,
            )}
        >
            <Input
                value={formatNationalDisplay(nationalDigits)}
                disabled={disabled}
                invalid={invalid}
                placeholder="+7 912 345 67 89"
                onChange={(event) => handleChange(event.target.value)}
                onPaste={handlePaste}
                onBlur={onBlur}
                inputMode="tel"
            />
        </div>
    )
}

export default PhoneInput
