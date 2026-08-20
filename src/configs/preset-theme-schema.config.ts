export type Variables =
    | 'primary'
    | 'primaryDeep'
    | 'primaryMild'
    | 'primarySubtle'
    | 'neutral'

export type ThemeVariables = Record<'light' | 'dark', Record<Variables, string>>

const defaultTheme: ThemeVariables = {
    light: {
        primary: '#2a85ff',
        primaryDeep: '#0069f6',
        primaryMild: '#4996ff',
        primarySubtle: '#2a85ff1a',
        neutral: '#ffffff',
    },
    dark: {
        primary: '#2a85ff',
        primaryDeep: '#0069f6',
        primaryMild: '#4996ff',
        primarySubtle: '#2a85ff1a',
        neutral: '#ffffff',
    },
}

const darkTheme: ThemeVariables = {
    light: {
        primary: '#18181b',
        primaryDeep: '#09090b',
        primaryMild: '#27272a',
        primarySubtle: '#18181b0d',
        neutral: '#ffffff',
    },
    dark: {
        primary: '#ffffff',
        primaryDeep: '#09090b',
        primaryMild: '#e5e7eb',
        primarySubtle: '#ffffff1a',
        neutral: '#111827',
    },
}

const grayTheme: ThemeVariables = {
    light: {
        primary: '#f4f6f8',
        primaryDeep: '#dfe3e8',
        primaryMild: '#e8ecf0',
        primarySubtle: '#f4f6f81a',
        neutral: '#1f2937',
    },
    dark: {
        primary: '#f4f6f8',
        primaryDeep: '#dfe3e8',
        primaryMild: '#ffffff',
        primarySubtle: '#f4f6f81a',
        neutral: '#1f2937',
    },
}

const purpleTheme: ThemeVariables = {
    light: {
        primary: '#8C62FF',
        primaryDeep: '#704acc',
        primaryMild: '#a784ff',
        primarySubtle: '#8C62FF1a',
        neutral: '#ffffff',
    },
    dark: {
        primary: '#8C62FF',
        primaryDeep: '#704acc',
        primaryMild: '#a784ff',
        primarySubtle: '#8C62FF1a',
        neutral: '#ffffff',
    },
}

const orangeTheme: ThemeVariables = {
    light: {
        primary: '#fb732c',
        primaryDeep: '#cc5c24',
        primaryMild: '#fc8f56',
        primarySubtle: '#fb732c1a',
        neutral: '#ffffff',
    },
    dark: {
        primary: '#fb732c',
        primaryDeep: '#cc5c24',
        primaryMild: '#fc8f56',
        primarySubtle: '#fb732c1a',
        neutral: '#ffffff',
    },
}

const stoneTheme: ThemeVariables = {
    light: {
        primary: '#8a7365',
        primaryDeep: '#6b574c',
        primaryMild: '#a89183',
        primarySubtle: '#8a73651a',
        neutral: '#ffffff',
    },
    dark: {
        primary: '#c4a99a',
        primaryDeep: '#a88f80',
        primaryMild: '#d9c4b8',
        primarySubtle: '#c4a99a1a',
        neutral: '#ffffff',
    },
}

const slateTheme: ThemeVariables = {
    light: {
        primary: '#E7E5E4',
        primaryDeep: '#D6D3D1',
        primaryMild: '#F5F5F4',
        primarySubtle: '#E7E5E41A',
        neutral: '#FAFAF9',
    },
    dark: {
		primary: '#8B8CFF',
		primaryDeep: '#6C6DFF',
		primaryMild: '#A8A9FF',
		primarySubtle: '#8B8CFF1A',
		neutral: '#1C1C1E',
    },
}

const roseTheme: ThemeVariables = {
    light: {
        primary: '#e11d48',
        primaryDeep: '#be123c',
        primaryMild: '#fb7185',
        primarySubtle: '#e11d481a',
        neutral: '#ffffff',
    },
    dark: {
        primary: '#fb7185',
        primaryDeep: '#e11d48',
        primaryMild: '#fda4af',
        primarySubtle: '#fb71851a',
        neutral: '#ffffff',
    },
}

const tealTheme: ThemeVariables = {
    light: {
        primary: '#0d9488',
        primaryDeep: '#0f766e',
        primaryMild: '#2dd4bf',
        primarySubtle: '#0d94881a',
        neutral: '#ffffff',
    },
    dark: {
        primary: '#2dd4bf',
        primaryDeep: '#14b8a6',
        primaryMild: '#5eead4',
        primarySubtle: '#2dd4bf1a',
        neutral: '#ffffff',
    },
}

const presetThemeSchemaConfig: Record<string, ThemeVariables> = {
    gray: grayTheme,
    default: defaultTheme,
    dark: darkTheme,
    purple: purpleTheme,
    orange: orangeTheme,
    rose: roseTheme,
    teal: tealTheme,
    stone: stoneTheme,
    slate: slateTheme,
}

export default presetThemeSchemaConfig
