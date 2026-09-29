import { z } from 'zod'

const RU_LETTERS = 'а-яА-ЯёЁ'

// Регулярка: только русские (кириллические) буквы, дефис или пробел между частями
const NAME_REGEX = new RegExp(`^[${RU_LETTERS}]+([ -][${RU_LETTERS}]+)*$`)

// Регулярка для проверки наличия английских (латинских) букв
const EN_LETTERS_REGEX = /[a-zA-Z]/

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

// Гласные буквы (русские)
const RU_VOWELS = 'аеёиоуыэюя'
const ALL_VOWELS = new Set(RU_VOWELS.split(''))

// Согласные буквы (русские)
const RU_CONSONANTS = 'бвгджзйклмнпрстфхцчшщ'
const ALL_CONSONANTS = new Set(RU_CONSONANTS.split(''))

// Белый список реальных 2-буквенных фамилий (азиатские и редкие)
const ALLOWED_TWO_LETTER_SURNAMES = new Set([
    'ли', 'ан', 'ян', 'юг', 'юн', 'ун', 'им', 'ин', 'го', 'по', 'цо', 'хо',
    'лю', 'уй', 'эх', 'ай', 'ок', 'до', 'то', 'чо', 'сы', 'бу', 'гу'
])

// Стоп-слова и риелторские пометки / заглушки
const STOP_WORDS = new Set([
    'хз', 'незнаю', 'не знаю', 'нет', 'нету', 'никто', 'тест', 'test',
    'клиент', 'client', 'покупатель', 'покупатели', 'бронь', 'звонок',
    'агент', 'риелтор', 'риэлтор', 'инвестор', 'подбор', 'лид', 'lead',
    'проверка', 'дубль', 'аноним', 'инкогнито', 'безфамилии', 'без имени',
    'неизвестно', 'не указано', 'не указан', 'пусто', 'заглушка', 'секрет',
    'позже', 'уточнить', 'уточняется', 'вопрос', 'запрос', 'номер',
    // родственные заглушки — запрещено как ФИО клиента
    'муж', 'жена', 'супруг', 'супруга',
    'отец', 'мать', 'мама', 'папа',
    'сын', 'дочь', 'дочка',
    'дедушка', 'бабушка', 'дед', 'баба',
    'внук', 'внучка',
    'брат', 'сестра',
])

// Суффиксы русских и национальных фамилий для отсечения основы
const SURNAME_SUFFIXES = [
    'ов', 'ова', 'ев', 'ева', 'ёв', 'ёва',
    'ин', 'ина', 'ын', 'ына',
    'ский', 'ская', 'цкий', 'цкая',
    'их', 'ых', 'ко', 'ук', 'юк', 'ак', 'як',
    'дзе', 'швили', 'ян', 'ман', 'берг', 'штейн',
    'ович', 'евич', 'овна', 'евна'
]



/**
 * Проверка на запрещённые стоп-слова и заглушки
 * Ловит и отдельные слова, и фразы внутри поля: "Муж Елены" → содержит "муж"
 */
export const isStopWord = (value?: string | null): boolean => {
    if (!value) return false
    const lower = value.toLowerCase().trim()
    if (!lower) return false
    // нормализованная строка без лишних пробелов/дефисов
    const normSpaced = lower.replace(/[\s\-_.]+/g, ' ').replace(/\s+/g, ' ').trim()
    const normNoSpace = normSpaced.replace(/\s/g, '')
    if (STOP_WORDS.has(normSpaced) || STOP_WORDS.has(lower) || STOP_WORDS.has(normNoSpace)) return true
    for (const stop of STOP_WORDS) {
        const cleanStop = stop.replace(/\s+/g, '')
        if (normNoSpace === cleanStop) return true
        if (normSpaced === stop.toLowerCase()) return true
    }
    // проверка по токенам — если хоть одно слово-заглушка внутри поля
    const tokens = normSpaced.split(' ')
    for (const token of tokens) {
        if (STOP_WORDS.has(token)) return true
        // токен без пунктуации
        const cleanToken = token.replace(/[^а-яёa-z]/g, '')
        if (cleanToken && STOP_WORDS.has(cleanToken)) return true
    }
    // проверка фраз-заглушек внутри ("не знаю", "без имени" и т.д.)
    for (const stop of STOP_WORDS) {
        const stopLower = stop.toLowerCase()
        if (stopLower.includes(' ')) {
            // фраза из 2+ слов — ищем как подпоследовательность токенов
            const stopTokens = stopLower.split(/\s+/)
            for (let i = 0; i <= tokens.length - stopTokens.length; i++) {
                let match = true
                for (let j = 0; j < stopTokens.length; j++) {
                    if (tokens[i + j] !== stopTokens[j]) {
                        match = false
                        break
                    }
                }
                if (match) return true
            }
            // также без пробелов: "незнаю" внутри "незнаю"
            if (normNoSpace.includes(stopLower.replace(/\s/g, ''))) {
                // убедимся что это не часть нормального слова (например "незнаю" целиком)
                if (normNoSpace === stopLower.replace(/\s/g, '')) return true
                // для фразы "не знаю" — если склеенная версия входит, тоже считаем
                // но избегаем ложных срабатываний, проверяем границы токенов
                // если фраза склеена, то она уже покрыта normNoSpace === cleanStop выше
            }
        } else {
            // одиночное стоп-слово — уже проверено по токенам, но также ловим внутри сложных?
            // "мужелены" не ловим, только отдельные токены
        }
    }
    return false
}

/**
 * Проверка на самоповтор слова (АннаАнна, ИванИван, ГуляГуля, Алисаалисаалиса)
 * Ловит 2-повторы и n-повторы вида "алиса"*3, "ааа"*n
 */
export const isSelfRepeatedWord = (value: string): boolean => {
    const clean = value.toLowerCase().replace(/[\s-]/g, '')
    const n = clean.length
    if (n < 4) return false

    // 1. Классический двойной повтор: половина == половина (АннаАнна)
    if (n % 2 === 0) {
        const half = n / 2
        if (clean.slice(0, half) === clean.slice(half)) {
            return true
        }
    }

    // 2. Любой n-повтор подстроки: "алисаалисаалиса" = "алиса"*3
    for (let len = 2; len <= Math.floor(n / 2); len++) {
        if (n % len !== 0) continue
        const pattern = clean.slice(0, len)
        if (pattern.repeat(n / len) === clean) {
            return true
        }
    }

    return false
}

const levenshtein = (a: string, b: string): number => {
    const m = a.length
    const n = b.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
        }
    }
    return dp[m][n]
}

/**
 * Проверка фонетической структуры (защита от "Ааоаьатраи", "впрст" и т.п.)
 */
export const hasPhoneticGibberish = (value: string): boolean => {
    const clean = value.toLowerCase().replace(/[\s-]/g, '')
    if (clean.length < 3) return false

    // 1. Некорректные позиции ъ и ь
    // ъ и ь не могут быть в начале
    if (clean.startsWith('ь') || clean.startsWith('ъ')) return true
    // ъ и ь не могут идти подряд (ьь, ъъ, ьъ, въь)
    if (/[ьъ]{2,}/.test(clean)) return true
    // В русском языке после ъ и ь перед гласными идут только е, ё, и, ю, я.
    // Сочетания ьа, ьо, ьу, ьы, ьэ, ъа, ъо, ъу, ъы, ъэ — признак клавиатурного мусора ("Ааоаьатраи")
    if (/[ьъ][аоуыэ]/i.test(clean)) return true

    // 2. Слишком много гласных подряд (4 и более)
    let consecutiveVowels = 0
    let maxConsecutiveVowels = 0
    for (const char of clean) {
        if (ALL_VOWELS.has(char)) {
            consecutiveVowels++
            if (consecutiveVowels > maxConsecutiveVowels) {
                maxConsecutiveVowels = consecutiveVowels
            }
        } else {
            consecutiveVowels = 0
        }
    }
    if (maxConsecutiveVowels >= 4) return true

    // 3. Слишком много согласных подряд (5 и более)
    let consecutiveConsonants = 0
    let maxConsecutiveConsonants = 0
    for (const char of clean) {
        if (ALL_CONSONANTS.has(char)) {
            consecutiveConsonants++
            if (consecutiveConsonants > maxConsecutiveConsonants) {
                maxConsecutiveConsonants = consecutiveConsonants
            }
        } else {
            consecutiveConsonants = 0
        }
    }
    if (maxConsecutiveConsonants >= 5) return true

    // 4. Дисбаланс гласных и согласных в длинных словах (>= 6 букв)
    if (clean.length >= 6) {
        let vowelsCount = 0
        let consonantsCount = 0
        for (const char of clean) {
            if (ALL_VOWELS.has(char)) vowelsCount++
            if (ALL_CONSONANTS.has(char)) consonantsCount++
        }
        const total = vowelsCount + consonantsCount
        if (total >= 6) {
            const vowelRatio = vowelsCount / total
            // Менее 15% гласных или более 75% гласных в длинном слове
            if (vowelRatio < 0.15 || vowelRatio > 0.75) return true
        }
    }

    return false
}

/**
 * Проверка взаимного дублирования фамилии и имени
 * Ловит: Алиса/Алиса, Аюлия/Юлия (расстояние 1, включает), Алисаалисаалиса/Алиса
 */
export const isFakeDuplication = (lastName?: string | null, firstName?: string | null): boolean => {
    if (!lastName || !firstName) return false
    const last = lastName.toLowerCase().trim()
    const first = firstName.toLowerCase().trim()

    // 1. Полное совпадение: Алиса / Алиса
    if (last === first) return true

    // 2. Дописывание последней буквы: Алиса / Алисаа, Иван / Иванн
    if (last === first + first.slice(-1) || first === last + last.slice(-1)) {
        return true
    }

    // 3. Фамилия состоит из n-повторов имени: Алисаалисаалиса / Алиса, ИванИванИван / Иван
    if (last.length > first.length && last.length % first.length === 0) {
        if (first.repeat(last.length / first.length) === last) return true
    }
    if (first.length > last.length && first.length % last.length === 0) {
        if (last.repeat(first.length / last.length) === first) return true
    }
    // Также если внутри есть двойной повтор: Алисаалиса / Алиса
    if (last.includes(first + first) || first.includes(last + last)) return true

    // 4. Одно содержит другое с малой разницей и без легитимного суффикса
    // Было startsWith — расширяем до includes чтобы ловить Аюлия / Юлия
    if ((last.includes(first) || first.includes(last)) && Math.abs(last.length - first.length) <= 2) {
        const hasLegitSuffix = SURNAME_SUFFIXES.some((s) => last.endsWith(s) || first.endsWith(s))
        if (!hasLegitSuffix) {
            return true
        }
    }

    // 5. Очень похожие строки (расстояние Левенштейна 1) — опечатка/фейк: Аюлия / Юлия, Олеся / Алеся
    // Но разрешаем Иванов Иван (расстояние 2 за счёт -ов) — поэтому только <=1
    if (levenshtein(last, first) <= 1) return true

    return false
}

/**
 * Проверка корректности фамилии (включая запрет мусорных 2-буквенных сокращений вроде "см", "ит")
 */
export const isValidSurname = (value?: string | null): boolean => {
    if (!value) return false
    const trimmed = value.trim()
    const clean = trimmed.toLowerCase().replace(/[\s-]/g, '')

    // Запрет английских букв
    if (EN_LETTERS_REGEX.test(trimmed)) return false

    // 1. Двухбуквенные фамилии — только из белого списка реальных (Ли, Ким, Ан и т.д.)
    if (clean.length === 2 && !ALLOWED_TWO_LETTER_SURNAMES.has(clean)) {
        return false
    }

    // 2. Стоп-слова (хз, не знаю, тест и т.д.)
    if (isStopWord(trimmed)) return false

    // 3. Самоповтор слова (АннаАнна)
    if (isSelfRepeatedWord(trimmed)) return false

    // 4. Фонетический мусор (Ааоаьатраи)
    if (hasPhoneticGibberish(trimmed)) return false

    return isValidHumanName(trimmed)
}

/**
 * Общая проверка имени/отчества человека
 */
export const isValidHumanName = (value?: string | null): boolean => {
    if (!value) return false
    const trimmed = value.trim()

    // Запрет английских букв
    if (EN_LETTERS_REGEX.test(trimmed)) return false

    // 1. Длина от 2 до 50
    if (trimmed.length < 2 || trimmed.length > 50) return false

    // 2. Стоп-слова (хз, не знаю и т.д.)
    if (isStopWord(trimmed)) return false

    // 3. Только русские буквы и допустимые разделители
    if (!NAME_REGEX.test(trimmed)) return false

    // 4. Запрет 3 одинаковых букв подряд (ааа, ссс)
    const cleanLetters = trimmed.toLowerCase().replace(/[\s-]/g, '')
    for (let i = 0; i < cleanLetters.length - 2; i++) {
        if (cleanLetters[i] === cleanLetters[i + 1] && cleanLetters[i] === cleanLetters[i + 2]) {
            return false
        }
    }

    // 5. Запрет двойных одинаковых гласных на конце слова (Алисаа, Катяя, Ираа)
    if (/(аа|яя|ее|ии|оо|уу|ыы|ээ|юю)$/i.test(cleanLetters)) {
        return false
    }

    // 6. Защита от одинаковых букв (ааааа, ыыыы)
    if (cleanLetters.length >= 2) {
        const first = cleanLetters[0]
        const allSame = cleanLetters.split('').every((char) => char === first)
        if (allSame) return false
    }

    // 7. Защита от чередования 2 букв (ыбыбыбыбыб, ахахах, татата)
    if (cleanLetters.length >= 4) {
        const pair = cleanLetters.slice(0, 2)
        const repeatedPair = pair.repeat(Math.ceil(cleanLetters.length / 2)).slice(0, cleanLetters.length)
        if (cleanLetters === repeatedPair) return false
    }

    // 8. Самоповтор слова (АннаАнна)
    if (isSelfRepeatedWord(trimmed)) return false

    // 9. Фонетический клавиатурный мусор (Ааоаьатраи)
    if (hasPhoneticGibberish(trimmed)) return false

    return true
}

/**
 * Валидатор для поля «Фамилия»
 */
export const lastNameFieldValidation = z
    .string()
    .transform((val) => normalizeHumanNameInput(val))
    .refine((val) => !EN_LETTERS_REGEX.test(val), {
        message: 'Используйте только русские буквы (латиница запрещена)',
    })
    .refine((val) => val.length >= 2, {
        message: 'Минимум 2 буквы',
    })
    .refine((val) => val.length <= 50, {
        message: 'Слишком длинное значение',
    })
    .refine((val) => !isStopWord(val), {
        message: 'Укажите реальную фамилию (не заглушку)',
    })
    .refine(
        (val) => {
            const clean = val.toLowerCase().replace(/[\s-]/g, '')
            return clean.length !== 2 || ALLOWED_TWO_LETTER_SURNAMES.has(clean)
        },
        {
            message: 'Фамилия не может состоять из 2 случайных букв (разрешены только Ли, Ан, Ким и т.п.)',
        },
    )
    .refine((val) => !isSelfRepeatedWord(val), {
        message: 'Фамилия содержит недопустимый повтор слова',
    })
    .refine((val) => !hasPhoneticGibberish(val), {
        message: 'Укажите реальную фамилию (некорректное сочетание букв)',
    })
    .refine((val) => NAME_REGEX.test(val), {
        message: 'Только русские буквы и дефис (без цифр, точек и спецсимволов)',
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

/**
 * Валидатор для поля «Имя»
 */
export const firstNameFieldValidation = z
    .string()
    .transform((val) => normalizeHumanNameInput(val))
    .refine((val) => !EN_LETTERS_REGEX.test(val), {
        message: 'Используйте только русские буквы (латиница запрещена)',
    })
    .refine((val) => val.length >= 2, {
        message: 'Минимум 2 буквы',
    })
    .refine((val) => val.length <= 50, {
        message: 'Слишком длинное значение',
    })
    .refine((val) => !isStopWord(val), {
        message: 'Укажите реальное имя (не заглушку)',
    })
    .refine((val) => !isSelfRepeatedWord(val), {
        message: 'Имя содержит недопустимый повтор слова',
    })
    .refine((val) => !hasPhoneticGibberish(val), {
        message: 'Укажите реальное имя (некорректное сочетание букв)',
    })
    .refine((val) => NAME_REGEX.test(val), {
        message: 'Только русские буквы и дефис (без цифр, точек и спецсимволов)',
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

/**
 * Для обратной совместимости
 */
export const nameFieldValidation = lastNameFieldValidation
