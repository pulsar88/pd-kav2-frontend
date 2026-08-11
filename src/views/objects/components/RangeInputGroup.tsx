import classNames from 'classnames'
import Input from '@/components/ui/Input'
import InputGroup from '@/components/ui/InputGroup'

const isFilled = (value: number | '' | undefined | null) =>
    value !== '' && value !== undefined && value !== null

const formatPriceValue = (value: number | '' | undefined) => {
    if (value === '' || value === undefined || value === null) return ''
    return new Intl.NumberFormat('ru-RU').format(Number(value))
}

type RangeInputGroupProps = {
    fromValue: number | '' | undefined
    toValue: number | '' | undefined
    fromPlaceholder?: string
    toPlaceholder?: string
    variant?: 'number' | 'price'
    filledClass?: string
    onFromChange: (value: number | '') => void
    onToChange: (value: number | '') => void
}

const RangeInputGroup = ({
    fromValue,
    toValue,
    fromPlaceholder = 'От',
    toPlaceholder = 'До',
    variant = 'number',
    filledClass,
    onFromChange,
    onToChange,
}: RangeInputGroupProps) => {
    const baseInputClass =
        variant === 'number'
            ? '[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            : '[-moz-appearance:textfield]'

    const parsePrice = (raw: string) => {
        const digits = raw.replace(/\D/g, '')
        return digits === '' ? '' : Number(digits)
    }

    if (variant === 'price') {
        return (
            <InputGroup>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={fromPlaceholder}
                    className={classNames(
                        baseInputClass,
                        isFilled(fromValue) && 'relative z-10',
                        isFilled(fromValue) && filledClass,
                    )}
                    value={formatPriceValue(fromValue)}
                    onChange={(e) => onFromChange(parsePrice(e.target.value))}
                />
                <InputGroup.Addon>до</InputGroup.Addon>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={toPlaceholder}
                    className={classNames(
                        baseInputClass,
                        isFilled(toValue) && 'relative z-10',
                        isFilled(toValue) && filledClass,
                    )}
                    value={formatPriceValue(toValue)}
                    onChange={(e) => onToChange(parsePrice(e.target.value))}
                />
            </InputGroup>
        )
    }

    return (
        <InputGroup>
            <Input
                type="number"
                placeholder={fromPlaceholder}
                className={classNames(
                    baseInputClass,
                    isFilled(fromValue) && 'relative z-10',
                    isFilled(fromValue) && filledClass,
                )}
                value={fromValue ?? ''}
                onChange={(e) =>
                    onFromChange(
                        e.target.value === '' ? '' : Number(e.target.value),
                    )
                }
            />
            <InputGroup.Addon>до</InputGroup.Addon>
            <Input
                type="number"
                placeholder={toPlaceholder}
                className={classNames(
                    baseInputClass,
                    isFilled(toValue) && 'relative z-10',
                    isFilled(toValue) && filledClass,
                )}
                value={toValue ?? ''}
                onChange={(e) =>
                    onToChange(
                        e.target.value === '' ? '' : Number(e.target.value),
                    )
                }
            />
        </InputGroup>
    )
}

export default RangeInputGroup
