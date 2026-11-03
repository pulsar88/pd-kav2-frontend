import { z } from 'zod'

const RU_LETTERS = 'а-яА-ЯёЁ'

// Только русские буквы, дефис или пробел между частями
const NAME_REGEX = new RegExp(`^[${RU_LETTERS}]+([ -][${RU_LETTERS}]+)*$`)

const CYRILLIC_MESSAGE = 'Только русские буквы и дефис (без цифр, точек и спецсимволов)'
const MIN_LENGTH_MESSAGE = 'Минимум 2 буквы'
const MAX_LENGTH_MESSAGE = 'Слишком длинное значение'

// Нормализация к виду "Иванов Дмитрий" — первая буква заглавная, остальные строчные
export const normalizeHumanName = (value: string): string => {
    if (!value) return ''
    const trimmed = value.trim().replace(/\s+/g, ' ')
    if (!trimmed) return ''
    return trimmed
        .split(/(\s+|-)/)
        .map((part) => {
            if (part === '-' || /^\s+$/.test(part) || !part) return part
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        })
        .join('')
}

// Для Zod-трансформов: trim + TitleCase
export const normalizeHumanNameInput = (value: string): string => normalizeHumanName(value)

const NAME_PART_REGEX = new RegExp(`^[${RU_LETTERS}]+(?:-[${RU_LETTERS}]+)*$`)

// Отчество узнаётся по окончанию: Иванович, Сергеевна, Ильич, Никитична
const PATRONYMIC_REGEX = /(?:ович|евич|овна|евна|инична|ична|ич|оглы|кызы|уулу)$/i

// Имена, которые по окончанию похожи на фамилии
const GIVEN_NAMES_LIKE_SURNAMES = new Set(['яков'])

const surnameScore = (word: string): number => {
    const tail = word.toLowerCase().split('-').pop() ?? ''
    if (GIVEN_NAMES_LIKE_SURNAMES.has(tail)) return 0
    if (/(?:ова|ева|ёва|ская|цкая|ский|цкий)$/.test(tail)) return 3
    if (/(?:ов|ев|ёв|ин|ын|их|ых|енко|ян|дзе|швили)$/.test(tail)) return 2
    return 0
}

const isPatronymic = (word: string): boolean => PATRONYMIC_REGEX.test(word)

export type ParsedFullName = {
    lastName: string
    firstName: string
    middleName: string
}

const assignLastAndFirst = (
    first: string,
    second: string,
): Pick<ParsedFullName, 'lastName' | 'firstName'> => {
    if (surnameScore(second) > surnameScore(first)) {
        return { lastName: second, firstName: first }
    }
    return { lastName: first, firstName: second }
}

/**
 * Разбирает вставленное ФИО.
 * «Иванов Иван Иванович» и «Иванов Иван» — фамилия впереди.
 * «Иван Иванович Иванов» — отчество в середине, фамилия в конце.
 * «Иван Иванов» и «Анна Петрова» — фамилия определяется по окончанию.
 * Два слова, где второе похоже на отчество, записываются в имя и отчество.
 */
export const splitPastedFullName = (value: string): ParsedFullName | null => {
    const parts = value
        .trim()
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map((part) => normalizeHumanName(part))

    if (parts.length < 2 || parts.length > 3) return null
    if (!parts.every((part) => NAME_PART_REGEX.test(part))) return null

    if (parts.length === 2) {
        const [first, second] = parts
        if (isPatronymic(second) && !isPatronymic(first)) {
            return { lastName: '', firstName: first, middleName: second }
        }
        if (isPatronymic(first) && !isPatronymic(second)) {
            return { lastName: '', firstName: second, middleName: first }
        }
        return { ...assignLastAndFirst(first, second), middleName: '' }
    }

    const patronymicFlags = parts.map((part) => isPatronymic(part))
    const patronymicCount = patronymicFlags.filter(Boolean).length

    if (patronymicCount === 1) {
        const patronymicIndex = patronymicFlags.indexOf(true)
        const middleName = parts[patronymicIndex]
        const rest = parts.filter((_, index) => index !== patronymicIndex)
        return { ...assignLastAndFirst(rest[0], rest[1]), middleName }
    }

    const [lastName, firstName, middleName] = parts
    const scores = parts.map(surnameScore)
    const maxScore = Math.max(...scores)
    const surnameIndex = scores.findIndex((score) => score === maxScore)
    const hasSingleSurname = scores.filter((score) => score === maxScore).length === 1

    if (hasSingleSurname && maxScore > 0 && surnameIndex === 2 && scores[0] === 0 && scores[1] === 0) {
        return {
            lastName: middleName,
            firstName: normalizeHumanName(`${lastName} ${firstName}`),
            middleName: '',
        }
    }

    return { lastName, firstName, middleName }
}

const cyrillicNameFieldValidation = z
    .string()
    .transform((val) => normalizeHumanNameInput(val))
    .refine((val) => val.length >= 2, {
        message: MIN_LENGTH_MESSAGE,
    })
    .refine((val) => val.length <= 50, {
        message: MAX_LENGTH_MESSAGE,
    })
    .refine((val) => NAME_REGEX.test(val), {
        message: CYRILLIC_MESSAGE,
    })

/**
 * Валидатор для поля «Фамилия»
 */
export const lastNameFieldValidation = cyrillicNameFieldValidation

/**
 * Валидатор для поля «Имя»
 */
export const firstNameFieldValidation = cyrillicNameFieldValidation

/**
 * Валидатор для поля «Отчество». Пустое значение допустимо.
 */
export const middleNameFieldValidation = z
    .string()
    .transform((val) => normalizeHumanNameInput(val))
    .refine((val) => !val || val.length >= 2, {
        message: MIN_LENGTH_MESSAGE,
    })
    .refine((val) => !val || val.length <= 50, {
        message: MAX_LENGTH_MESSAGE,
    })
    .refine((val) => !val || NAME_REGEX.test(val), {
        message: CYRILLIC_MESSAGE,
    })
    .optional()

/**
 * Для обратной совместимости
 */
export const nameFieldValidation = lastNameFieldValidation
