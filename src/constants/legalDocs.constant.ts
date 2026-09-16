export const LEGAL_DOCS = {
    soglasieOpdAgenta: '/docs/soglasie-opd-agenta.pdf',
    politikaKpd: '/docs/politika-kpd.pdf',
    politikaOpd: '/docs/politika-opd.pdf',
    soglasieReklama: '/docs/soglasie-reklama.pdf',
    reglament: '/docs/reglament.pdf',
} as const

export type LegalDocKey = keyof typeof LEGAL_DOCS

export const LEGAL_DOC_LINKS: Array<{
    key: LegalDocKey
    href: string
    label: string
}> = [
    {
        key: 'soglasieOpdAgenta',
        href: LEGAL_DOCS.soglasieOpdAgenta,
        label: 'Согласие на ОПД Агента',
    },
    {
        key: 'politikaKpd',
        href: LEGAL_DOCS.politikaKpd,
        label: 'Политика КПД',
    },
    {
        key: 'politikaOpd',
        href: LEGAL_DOCS.politikaOpd,
        label: 'Политика в отношении ОПД',
    },
    {
        key: 'soglasieReklama',
        href: LEGAL_DOCS.soglasieReklama,
        label: 'Согласие на рекламу',
    },
    {
        key: 'reglament',
        href: LEGAL_DOCS.reglament,
        label: 'Инструкция и регламент',
    },
]
