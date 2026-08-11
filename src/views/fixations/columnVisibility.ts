export const FIXATIONS_COLUMNS_STORAGE_KEY =
    'agent-cabinet:fixations-column-visibility'

export type FixationColumnId =
    | 'fullName'
    | 'phone'
    | 'projectName'
    | 'status'
    | 'createdAt'
    | 'expiresAt'

export type FixationColumnVisibility = Record<FixationColumnId, boolean>

export const FIXATION_COLUMN_OPTIONS: Array<{
    id: FixationColumnId
    label: string
}> = [
    { id: 'fullName', label: 'ФИО' },
    { id: 'phone', label: 'Номер' },
    { id: 'projectName', label: 'ЖК' },
    { id: 'status', label: 'Статус' },
    { id: 'createdAt', label: 'Дата создания' },
    { id: 'expiresAt', label: 'Дата истечения' },
]

export const DEFAULT_FIXATION_COLUMN_VISIBILITY: FixationColumnVisibility = {
    fullName: true,
    phone: true,
    projectName: true,
    status: true,
    createdAt: true,
    expiresAt: true,
}

export const loadFixationColumnVisibility = (): FixationColumnVisibility => {
    if (typeof window === 'undefined') {
        return DEFAULT_FIXATION_COLUMN_VISIBILITY
    }

    try {
        const raw = localStorage.getItem(FIXATIONS_COLUMNS_STORAGE_KEY)
        if (!raw) return DEFAULT_FIXATION_COLUMN_VISIBILITY

        const parsed = JSON.parse(raw) as Partial<FixationColumnVisibility>
        return {
            ...DEFAULT_FIXATION_COLUMN_VISIBILITY,
            ...parsed,
        }
    } catch {
        return DEFAULT_FIXATION_COLUMN_VISIBILITY
    }
}

export const saveFixationColumnVisibility = (
    visibility: FixationColumnVisibility,
) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(FIXATIONS_COLUMNS_STORAGE_KEY, JSON.stringify(visibility))
}
