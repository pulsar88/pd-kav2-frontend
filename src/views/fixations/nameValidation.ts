import { z } from 'zod'

const RU_LETTERS = 'а-яА-ЯёЁ'
const EN_LETTERS = 'a-zA-Z'
const ALL_LETTERS = `${RU_LETTERS}${EN_LETTERS}`

// Регулярка: только буквы, дефис или пробел между частями
const NAME_REGEX = new RegExp(`^[${ALL_LETTERS}]+([ -][${ALL_LETTERS}]+)*$`)

// Стандартные суффиксы и окончания реальных фамилий
const LEGIT_SURNAME_SUFFIXES = [
    'ов', 'ова', 'ев', 'ева', 'ёв', 'ёва',
    'ин', 'ина', 'ын', 'ына',
    'ский', 'ская', 'цкий', 'цкая',
    'их', 'ых', 'ко', 'ук', 'юк',
    'дзе', 'швили', 'ян', 'ман', 'берг', 'штейн'
]

export const isFakeDuplication = (lastName?: string | null, firstName?: string | null): boolean => {
    if (!lastName || !firstName) return false
    const last = lastName.toLowerCase().trim()
    const first = firstName.toLowerCase().trim()

    // 1. Полное совпадение: Алиса / Алиса
    if (last === first) return true

    // 2. Дописывание последней буквы: Алиса / Алисаа, Иван / Иванн, Катя / Катяя
    if (last === first + first.slice(-1) || first === last + last.slice(-1)) {
        return true
    }

    // 3. Одно слово содержит другое и разница 1-2 буквы, но у фамилии нет стандартного окончания
    // Например: Алиса / Алисаа, Алиса / Алисав, Катя / Катяя
    if ((last.startsWith(first) || first.startsWith(last)) && Math.abs(last.length - first.length) <= 2) {
        const hasLegitSuffix = LEGIT_SURNAME_SUFFIXES.some((s) => last.endsWith(s))
        if (!hasLegitSuffix) {
            return true
        }
    }

    return false
}

export const isValidHumanName = (value?: string | null): boolean => {
    if (!value) return false
    const trimmed = value.trim()

    // 1. Длина от 2 до 50
    if (trimmed.length < 2 || trimmed.length > 50) return false

    // 2. Только буквы и допустимые разделители
    if (!NAME_REGEX.test(trimmed)) return false

    // 3. Запрет 3 одинаковых букв подряд (ааа, ссс)
    const cleanLetters = trimmed.toLowerCase().replace(/[\s-]/g, '')
    for (let i = 0; i < cleanLetters.length - 2; i++) {
        if (cleanLetters[i] === cleanLetters[i + 1] && cleanLetters[i] === cleanLetters[i + 2]) {
            return false
        }
    }

    // 4. Запрет двойных одинаковых гласных на конце слова (Алисаа, Алинаа, Катяя, Ираа)
    if (/(аа|яя|ее|ии|оо|уу|ыы|ээ|юю)$/i.test(cleanLetters)) {
        return false
    }

    // 5. Защита от одинаковых букв (ааааа, ыыыы)
    if (cleanLetters.length >= 2) {
        const first = cleanLetters[0]
        const allSame = cleanLetters.split('').every((char) => char === first)
        if (allSame) return false
    }

    // 6. Защита от чередования 2 букв (ыбыбыбыбыб, ахахах, татата)
    if (cleanLetters.length >= 4) {
        const pair = cleanLetters.slice(0, 2)
        const repeatedPair = pair.repeat(Math.ceil(cleanLetters.length / 2)).slice(0, cleanLetters.length)
        if (cleanLetters === repeatedPair) return false
    }

    return true
}

export const nameFieldValidation = z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, {
        message: 'Минимум 2 буквы',
    })
    .refine((val) => val.length <= 50, {
        message: 'Слишком длинное значение',
    })
    .refine((val) => NAME_REGEX.test(val), {
        message: 'Только буквы и дефис (без цифр, точек и спецсимволов)',
    })
    .refine(
        (val) => {
            const clean = val.toLowerCase().replace(/[\s-]/g, '')
            for (let i = 0; i < clean.length - 2; i++) {
                if (clean[i] === clean[i + 1] && clean[i] === clean[i + 2]) {
                    return false
                }
            }
            return true
        },
        {
            message: 'Не более 2 одинаковых букв подряд',
        },
    )
    .refine(
        (val) => !/(аа|яя|ее|ии|оо|уу|ыы|ээ|юю)$/i.test(val.toLowerCase().replace(/[\s-]/g, '')),
        {
            message: 'Некорректное окончание (двойная гласная в конце)',
        },
    )
    .refine(
        (val) => {
            const clean = val.toLowerCase().replace(/[\s-]/g, '')
            if (clean.length < 2) return true
            return !clean.split('').every((ch) => ch === clean[0])
        },
        {
            message: 'Введите реальное значение, а не повтор одной буквы',
        },
    )
    .refine(
        (val) => {
            const clean = val.toLowerCase().replace(/[\s-]/g, '')
            if (clean.length < 4) return true
            const pair = clean.slice(0, 2)
            const repeated = pair.repeat(Math.ceil(clean.length / 2)).slice(0, clean.length)
            return clean !== repeated
        },
        {
            message: 'Введите реальное значение, а не случайный набор букв',
        },
    )
