import type { ReactNode } from 'react'
import type { Premise } from '@/views/objects/types'

export type ComparisonCategoryKey =
    | 'general'
    | 'pricing'
    | 'dimensions'
    | 'finishing'
    | 'construction'

export type ComparisonCategory = {
    key: ComparisonCategoryKey
    title: string
    icon?: ReactNode
}

export type HighlightRule = 'min-is-best' | 'max-is-best' | 'none'

export type ComparisonRowDef = {
    id: string
    category: ComparisonCategoryKey
    label: string
    icon?: ReactNode
    getRawValue: (premise: Premise) => string | number | null | undefined
    renderCell: (premise: Premise, allPremises: Premise[]) => ReactNode
    highlightRule?: HighlightRule
}
