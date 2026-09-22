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
        const digits = normalizeRuPhoneDigits(raw).slice(0, 10)
        if (digits && digits[0] !== '9') return
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
                onBlur={onBlur}
                inputMode="tel"
            />
        </div>
    )
}

export default PhoneInput
