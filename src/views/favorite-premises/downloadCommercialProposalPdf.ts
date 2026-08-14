import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Complex, Premise } from '@/views/objects/types'
import {
    formatArea,
    formatPrice,
    houseStatusLabel,
    houseTypeLabel,
    getPremiseTypeLabel,
} from '@/views/objects/utils'

pdfMake.addVirtualFileSystem(pdfFonts)

type CommercialProposalItem = {
    premise: Premise
    complex?: Complex | null
}

export type CommercialProposalManager = {
    name: string
    phone: string
}

const IMAGE_WIDTH = 230
const IMAGE_HEIGHT = 260

const roomsLabel = (rooms: number) =>
    rooms === 0 ? 'Студия' : `${rooms}-комн.`

const resolveHouseStatusLabel = (premise: Premise) => {
    if (premise.houseStatus) {
        return houseStatusLabel[premise.houseStatus]
    }

    return premise.buildingState || ''
}

const resolvePremisePlanImageUrl = (premise: Premise) =>
    premise.layoutImage ?? premise.floorPlanImage ?? null

const resolveComplexPlanImageUrl = (premise: Premise) =>
    premise.floorPlanImage ?? null

const kv = (label: string, value: string) => ({
    columns: [
        {
            width: 110,
            text: label,
            style: 'fieldLabel',
        },
        {
            width: '*',
            text: value || '—',
            style: 'fieldValue',
        },
    ],
    margin: [0, 0, 0, 5] as [number, number, number, number],
})

const sectionTitle = (text: string) => ({
    text,
    style: 'sectionTitle',
    margin: [0, 0, 0, 10] as [number, number, number, number],
})

const imagePlaceholder = (label: string) => ({
    table: {
        widths: [IMAGE_WIDTH],
        heights: [IMAGE_HEIGHT],
        body: [
            [
                {
                    text: label,
                    alignment: 'center' as const,
                    color: '#9CA3AF',
                    fontSize: 11,
                    margin: [0, IMAGE_HEIGHT / 2 - 8, 0, 0] as [
                        number,
                        number,
                        number,
                        number,
                    ],
                },
            ],
        ],
    },
    layout: {
        hLineColor: () => '#D1D5DB',
        vLineColor: () => '#D1D5DB',
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
    },
})

const toAbsoluteUrl = (url: string) => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
    if (typeof window === 'undefined') return url
    return new URL(url, window.location.origin).toString()
}

const fetchImageAsDataUrl = async (url?: string | null) => {
    if (!url) return null

    try {
        const response = await fetch(toAbsoluteUrl(url))
        if (!response.ok) return null
        const blob = await response.blob()
        return await new Promise<string | null>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                resolve(
                    typeof reader.result === 'string' ? reader.result : null,
                )
            }
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

const buildImageOrPlaceholder = (
    dataUrl: string | null,
    placeholderLabel: string,
) => {
    if (dataUrl) {
        return {
            image: dataUrl,
            width: IMAGE_WIDTH,
            fit: [IMAGE_WIDTH, IMAGE_HEIGHT] as [number, number],
            alignment: 'center' as const,
        }
    }
    return imagePlaceholder(placeholderLabel)
}

const buildPremiseFields = (premise: Premise) => [
    kv('Тип', getPremiseTypeLabel(premise)),
    ...(premise.complexName ? [kv('Дом', premise.complexName)] : []),
    ...(premise.address ? [kv('Адрес', premise.address)] : []),
    ...(premise.section ? [kv('Секция', premise.section)] : []),
    kv('Номер', `№ ${premise.number}`),
    kv('Комнат', roomsLabel(premise.rooms)),
    kv('Площадь', formatArea(premise.area)),
    kv(
        'Этаж',
        premise.floorsInBuilding
            ? `${premise.floor} из ${premise.floorsInBuilding}`
            : String(premise.floor),
    ),
    ...(premise.goodArea !== undefined
        ? [kv('Жилая площадь', formatArea(premise.goodArea))]
        : []),
    ...(premise.price !== undefined
        ? [kv('Цена', formatPrice(premise.price))]
        : []),
    ...(premise.pricePerSqm !== undefined
        ? [kv('Цена за м²', `${formatPrice(premise.pricePerSqm)} / м²`)]
        : []),
    ...(premise.layout ? [kv('Планировка', premise.layout)] : []),
    ...(premise.ceilingHeight
        ? [kv('Высота потолков', `${premise.ceilingHeight} м`)]
        : []),
    ...(premise.description ? [kv('Описание', premise.description)] : []),
]

const buildComplexFields = (premise: Premise, complex?: Complex | null) => {
    const name = complex?.name || premise.complexName
    const address = complex?.address || premise.address
    const delivery = premise.deliveryDate || complex?.completionDate
    const houseStatus = resolveHouseStatusLabel(premise)
    const floors = complex?.floors || premise.floorsInBuilding

    return [
        kv('Название', name || '—'),
        kv('Адрес', address || '—'),
        ...(premise.material ? [kv('Материал', premise.material)] : []),
        ...(premise.facing ? [kv('Отделка', premise.facing)] : []),
        ...(premise.houseType
            ? [kv('Тип дома', houseTypeLabel[premise.houseType])]
            : []),
        ...(houseStatus ? [kv('Статус дома', houseStatus)] : []),
        ...(premise.developmentStart
            ? [kv('Начало строительства', premise.developmentStart)]
            : []),
        ...(delivery ? [kv('Срок сдачи', delivery)] : []),
        ...(floors !== undefined ? [kv('Этажность', String(floors))] : []),
        ...(complex?.apartmentsCount !== undefined
            ? [kv('Квартир в продаже', String(complex.apartmentsCount))]
            : []),
        ...(complex?.priceFrom !== undefined
            ? [kv('Цена от', formatPrice(complex.priceFrom))]
            : []),
        ...(complex?.pricePerSqm !== undefined
            ? [
                  kv(
                      'Цена за м² от',
                      `${formatPrice(complex.pricePerSqm)} / м²`,
                  ),
              ]
            : []),
    ]
}

const resolveComplexTitle = (premise: Premise, complex?: Complex | null) => {
    const name = complex?.name || premise.complexName
    return name ? `Жилой комплекс «${name}»` : 'Жилой комплекс'
}

const buildTwoColumnBlock = (
    title: string,
    left: ReturnType<typeof buildImageOrPlaceholder>,
    rightFields: ReturnType<typeof kv>[],
) => [
    sectionTitle(title),
    {
        columns: [
            {
                width: IMAGE_WIDTH,
                stack: [left],
            },
            {
                width: '*',
                stack: rightFields,
                margin: [16, 0, 0, 0] as [number, number, number, number],
            },
        ],
        columnGap: 12,
    },
]

const buildFooter =
    (manager: CommercialProposalManager) =>
    () => ({
        columns: [
            {
                text: manager.name || '—',
                alignment: 'left' as const,
                fontSize: 9,
                color: '#6B7280',
            },
            {
                text: manager.phone || '—',
                alignment: 'right' as const,
                fontSize: 9,
                color: '#6B7280',
            },
        ],
        margin: [40, 8, 40, 24] as [number, number, number, number],
    })

export const downloadCommercialProposalPdf = async (
    items: CommercialProposalItem[],
    manager?: CommercialProposalManager,
) => {
    if (!items.length) return

    const prepared = await Promise.all(
        items.map(async (item) => {
            const [premisePlanImage, complexPlanImage] = await Promise.all([
                fetchImageAsDataUrl(resolvePremisePlanImageUrl(item.premise)),
                fetchImageAsDataUrl(resolveComplexPlanImageUrl(item.premise)),
            ])

            return {
                ...item,
                premisePlanImage,
                complexPlanImage,
            }
        }),
    )

    const content = prepared.flatMap((item, index) => {
        const block = [
            {
                text: `Коммерческое предложение ${index + 1} из ${prepared.length}`,
                style: 'eyebrow',
                margin: [0, 0, 0, 8] as [number, number, number, number],
            },
            ...buildTwoColumnBlock(
                `Помещение № ${item.premise.number}`,
                buildImageOrPlaceholder(
                    item.premisePlanImage,
                    'Планировка',
                ),
                buildPremiseFields(item.premise),
            ),
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 515,
                        y2: 0,
                        lineWidth: 1,
                        lineColor: '#D1D5DB',
                    },
                ],
                margin: [0, 16, 0, 16] as [number, number, number, number],
            },
            ...buildTwoColumnBlock(
                resolveComplexTitle(item.premise, item.complex),
                buildImageOrPlaceholder(
                    item.complexPlanImage,
                    'План этажа',
                ),
                buildComplexFields(item.premise, item.complex),
            ),
        ]

        if (index < prepared.length - 1) {
            return [...block, { text: '', pageBreak: 'after' as const }]
        }
        return block
    })

    const docDefinition = {
        pageOrientation: 'portrait' as const,
        pageMargins: [40, 40, 40, 56] as [number, number, number, number],
        ...(manager?.name || manager?.phone
            ? { footer: buildFooter(manager) }
            : {}),
        content: [
            {
                text: 'Коммерческое предложение',
                style: 'title',
                margin: [0, 0, 0, 6] as [number, number, number, number],
            },
            {
                text: `Помещений в подборке: ${prepared.length}`,
                style: 'subtitle',
                margin: [0, 0, 0, 20] as [number, number, number, number],
            },
            ...content,
        ],
        styles: {
            title: {
                fontSize: 18,
                bold: true,
            },
            subtitle: {
                fontSize: 11,
                color: '#6B7280',
            },
            eyebrow: {
                fontSize: 10,
                color: '#6B7280',
            },
            sectionTitle: {
                fontSize: 14,
                bold: true,
            },
            fieldLabel: {
                fontSize: 10,
                color: '#6B7280',
            },
            fieldValue: {
                fontSize: 11,
                bold: true,
            },
        },
        defaultStyle: {
            fontSize: 10,
        },
    }

    pdfMake.createPdf(docDefinition).open()
}
