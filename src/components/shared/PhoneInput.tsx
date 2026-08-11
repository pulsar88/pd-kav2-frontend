import { useEffect, useMemo, useState } from 'react'
import classNames from '@/utils/classNames'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { countryList } from '@/constants/countries.constant'
import {
    formatRuPhone,
    normalizeRuPhoneDigits,
} from '@/views/fixations/utils'

type CountryOption = {
    value: string
    label: string
    dialCode: string
}

const normalizeDialCode = (dialCode: string) =>
    dialCode.replace(/\s+/g, '').trim() || '+7'

const countryOptions: CountryOption[] = (() => {
    const mapped = countryList.map((item) => ({
        value: item.value,
        label: item.label,
        dialCode: normalizeDialCode(item.dialCode),
    }))

    const russia = mapped.filter((item) => item.value === 'RU')
    const rest = mapped
        .filter((item) => item.value !== 'RU')
        .sort((a, b) => {
            const byDial = a.dialCode.localeCompare(b.dialCode, 'en', {
                numeric: true,
            })
            if (byDial !== 0) return byDial
            return a.value.localeCompare(b.value)
        })

    return [...russia, ...rest]
})()

const formatNationalDisplay = (digits: string) => {
    const value = digits.slice(0, 10)
    if (!value) return ''

    const parts = [
        value.slice(0, 3),
        value.slice(3, 6),
        value.slice(6, 8),
        value.slice(8, 10),
    ].filter((part) => part.length > 0)

    return parts.join(' ')
}

const toInputDisplay = (country: CountryOption, nationalDigits: string) => {
    if (country.value === 'RU') {
        const national = formatNationalDisplay(nationalDigits)
        return national ? `${country.dialCode} ${national}` : country.dialCode
    }

    const national = nationalDigits.replace(/\D/g, '')
    return national ? `${country.dialCode} ${national}` : country.dialCode
}

const toFullPhone = (country: CountryOption, nationalDigits: string) => {
    if (country.value === 'RU') {
        return formatRuPhone(nationalDigits)
    }

    const national = nationalDigits.replace(/\D/g, '')
    if (!national) return country.dialCode
    return `${country.dialCode} ${national}`
}

const extractNationalDigits = (
    input: string,
    country: CountryOption,
): string => {
    if (country.value === 'RU') {
        return normalizeRuPhoneDigits(input)
    }

    const dialDigits = country.dialCode.replace(/\D/g, '')
    let digits = input.replace(/\D/g, '')
    if (dialDigits && digits.startsWith(dialDigits)) {
        digits = digits.slice(dialDigits.length)
    }
    return digits.slice(0, 15)
}

const CountryFlag = ({
    code,
    size = 20,
}: {
    code: string
    size?: number
}) => (
    <Avatar
        size={size}
        shape="circle"
        src={`/img/countries/${code}.png`}
        className="shrink-0 bg-transparent"
    />
)

export type PhoneInputProps = {
    value?: string
    className?: string
    disabled?: boolean
    invalid?: boolean
    completeClassName?: string
    countryCode?: string
    onBlur?: () => void
    onChange?: (formattedFullPhone: string) => void
    onCountryCodeChange?: (countryCode: string) => void
}

const PhoneInput = ({
    value = '',
    className,
    disabled,
    invalid,
    completeClassName = 'border-primary ring-1 ring-primary bg-primary/5 text-primary',
    countryCode = 'RU',
    onBlur,
    onChange,
    onCountryCodeChange,
}: PhoneInputProps) => {
    const [selectedCountryCode, setSelectedCountryCode] = useState(countryCode)

    useEffect(() => {
        setSelectedCountryCode(countryCode)
    }, [countryCode])

    const country =
        countryOptions.find((item) => item.value === selectedCountryCode) ||
        countryOptions[0]

    const nationalDigits = useMemo(
        () => extractNationalDigits(value, country),
        [country, value],
    )

    const inputValue = toInputDisplay(country, nationalDigits)

    const isComplete =
        country.value === 'RU'
            ? nationalDigits.length === 10
            : nationalDigits.length >= 6

    const placeholder =
        country.value === 'RU'
            ? `${country.dialCode} 912 345 67 89`
            : `${country.dialCode} ...`

    const emitChange = (nextCountry: CountryOption, digits: string) => {
        onChange?.(toFullPhone(nextCountry, digits))
    }

    const handlePhoneChange = (raw: string) => {
        const dial = country.dialCode
        // Не даём стереть код страны целиком — оставляем минимум dial code
        if (!raw.trim() || raw.replace(/\D/g, '').length < dial.replace(/\D/g, '').length) {
            emitChange(country, '')
            return
        }

        emitChange(country, extractNationalDigits(raw, country))
    }

    return (
        <div
            className={classNames(
                'phone-input flex items-stretch gap-2',
                invalid && 'phone-input-invalid',
                className,
            )}
        >
            <div className="w-[4.25rem] shrink-0">
                <Select<CountryOption, false>
                    className="h-full w-full"
                    classNames={{
                        control: (state) =>
                            classNames(
                                'select-control !flex h-12 min-h-12 !items-center !justify-center !gap-0 !px-1',
                                'bg-gray-100 dark:bg-gray-700',
                                state.isFocused &&
                                    'select-control-focused ring-1 ring-primary border-primary bg-transparent',
                                state.isDisabled &&
                                    'opacity-50 cursor-not-allowed',
                                invalid &&
                                    'select-control-invalid bg-error-subtle',
                            ),
                        valueContainer: () =>
                            '!m-0 !flex !flex-none !items-center !justify-center !overflow-visible !p-0',
                        indicatorsContainer: () =>
                            'select-indicators-container !m-0 !flex !flex-none !items-center !px-0 !text-2xl leading-none',
                        singleValue: () =>
                            '!relative !inset-auto !m-0 !max-w-none !translate-x-0 !translate-y-0 !transform-none !overflow-visible',
                        input: () =>
                            '!absolute !m-0 !h-0 !w-0 !min-w-0 !p-0 !opacity-0',
                        menu: () =>
                            'select-menu !bg-gray-100 dark:!bg-gray-700 !border-gray-200 dark:!border-gray-600 !ring-gray-200 dark:!ring-gray-600',
                        option: () =>
                            'select-option text-gray-800 dark:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-600',
                    }}
                    isSearchable
                    isClearable={false}
                    isDisabled={disabled}
                    menuPortalTarget={
                        typeof document !== 'undefined'
                            ? document.body
                            : undefined
                    }
                    menuPosition="fixed"
                    placeholder=""
                    options={countryOptions}
                    value={country}
                    getOptionLabel={(option) => option.dialCode}
                    getOptionValue={(option) => option.value}
                    filterOption={(option, rawInput) => {
                        const q = rawInput.trim().toLowerCase()
                        if (!q) return true
                        return (
                            option.data.dialCode.toLowerCase().includes(q) ||
                            option.data.value.toLowerCase().includes(q) ||
                            option.data.label.toLowerCase().includes(q)
                        )
                    }}
                    formatOptionLabel={(option, { context }) =>
                        context === 'menu' ? (
                            <div className="flex w-full min-w-0 items-center gap-2">
                                <CountryFlag code={option.value} size={18} />
                                <span className="font-semibold tabular-nums">
                                    {option.dialCode}
                                </span>
                                <span className="ml-auto shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {option.value}
                                </span>
                            </div>
                        ) : (
                            <span className="flex items-center justify-center">
                                <CountryFlag code={option.value} size={20} />
                            </span>
                        )
                    }
                    styles={{
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 80,
                        }),
                        control: () => ({}),
                        menu: () => ({
                            width: 200,
                            minWidth: 200,
                        }),
                        option: () => ({}),
                        valueContainer: () => ({}),
                        input: () => ({}),
                        singleValue: () => ({}),
                        indicatorsContainer: () => ({}),
                    }}
                    onChange={(option) => {
                        const next =
                            (option as CountryOption | null) ||
                            countryOptions[0]
                        setSelectedCountryCode(next.value)
                        onCountryCodeChange?.(next.value)
                        emitChange(next, nationalDigits)
                    }}
                />
            </div>

            <div className="min-w-0 flex-1">
                <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    data-slot="phone-input"
                    maxLength={country.value === 'RU' ? 16 : 20}
                    placeholder={placeholder}
                    disabled={disabled}
                    invalid={invalid}
                    value={inputValue}
                    className={classNames(isComplete && completeClassName)}
                    onBlur={onBlur}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onPaste={(e) => {
                        e.preventDefault()
                        handlePhoneChange(e.clipboardData.getData('text'))
                    }}
                    onKeyDown={(e) => {
                        // Не даём Backspace/Delete убрать код страны
                        const dialLen = country.dialCode.length
                        const input = e.currentTarget
                        const start = input.selectionStart ?? 0
                        const end = input.selectionEnd ?? 0

                        if (
                            (e.key === 'Backspace' && start <= dialLen && start === end) ||
                            (e.key === 'Backspace' && start < dialLen) ||
                            (e.key === 'Delete' && start < dialLen)
                        ) {
                            if (nationalDigits.length === 0) {
                                e.preventDefault()
                            } else if (start <= dialLen) {
                                e.preventDefault()
                                emitChange(
                                    country,
                                    nationalDigits.slice(0, -1),
                                )
                            }
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default PhoneInput
