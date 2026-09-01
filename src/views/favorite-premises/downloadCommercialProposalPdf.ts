import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Complex, Premise } from '@/views/objects/types'
import {
    formatArea,
    formatPrice,
    houseStatusLabel,
    houseTypeLabel,
    getPremiseTypeLabel,
    parseComplexPromoText,
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

const IMAGE_WIDTH = 220
const IMAGE_HEIGHT = 220
const CONTENT_WIDTH = 515
const FULL_WIDTH_IMAGE_HEIGHT = 280

const roomsLabel = (rooms: number) =>
    rooms === 0 ? 'Студия' : `${rooms}-комн.`

const resolveHouseStatusLabel = (premise: Premise) => {
    if (premise.houseStatus) {
        return houseStatusLabel[premise.houseStatus]
    }

    return premise.buildingState || ''
}

const resolveLayoutImageUrl = (premise: Premise) => premise.layoutImage ?? null

const resolveFloorPlanImageUrl = (premise: Premise) =>
    premise.floorPlanImage ?? null

const resolveComplexImageUrl = (premise: Premise, complex?: Complex | null) =>
    complex?.image ?? premise.complexImage ?? null

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
    margin: [0, 0, 0, 3.5] as [number, number, number, number],
})

const sectionTitle = (text: string) => ({
    text,
    style: 'sectionTitle',
    margin: [0, 0, 0, 6] as [number, number, number, number],
})

const imagePlaceholder = (
    label: string,
    width = IMAGE_WIDTH,
    height = IMAGE_HEIGHT,
) => ({
    table: {
        widths: [width],
        heights: [height],
        body: [
            [
                {
                    text: label,
                    alignment: 'center' as const,
                    color: '#9CA3AF',
                    fontSize: 11,
                    margin: [0, height / 2 - 8, 0, 0] as [
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

const sectionDivider = () => ({
    canvas: [
        {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: CONTENT_WIDTH,
            y2: 0,
            lineWidth: 1,
            lineColor: '#E5E7EB',
        },
    ],
    margin: [0, 8, 0, 8] as [number, number, number, number],
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
    width = IMAGE_WIDTH,
    height = IMAGE_HEIGHT,
) => {
    if (dataUrl) {
        return {
            image: dataUrl,
            width,
            fit: [width, height] as [number, number],
            alignment: 'center' as const,
        }
    }
    return imagePlaceholder(placeholderLabel, width, height)
}

const buildFullWidthImageBlock = (
    dataUrl: string | null,
    placeholderLabel: string,
    maxHeight = FULL_WIDTH_IMAGE_HEIGHT,
) => {
    if (dataUrl) {
        return {
            image: dataUrl,
            width: CONTENT_WIDTH,
            fit: [CONTENT_WIDTH, maxHeight] as [number, number],
            alignment: 'center' as const,
            margin: [0, 0, 0, 0] as [number, number, number, number],
        }
    }

    return imagePlaceholder(
        placeholderLabel,
        CONTENT_WIDTH,
        maxHeight,
    )
}

const calculateAvailableFloorPlanHeight = (
    isFirstPremise: boolean,
    premiseFieldsCount: number,
) => {
    // Высота A4 в portrait: 842 pt. Отступы: 36 сверху, 48 снизу -> доступно 758 pt
    const pageUsableHeight = 752
    const docHeaderHeight = isFirstPremise ? 52 : 0
    const eyebrowHeight = 18
    const premiseTitleHeight = 22
    // Высота блока помещения: максимум из высоты картинки планировки (220) и строк параметров
    const premiseDetailsHeight = Math.max(220, premiseFieldsCount * 15.5 + 4)
    const dividerHeight = 17
    const floorPlanTitleHeight = 20

    const usedHeight =
        docHeaderHeight +
        eyebrowHeight +
        premiseTitleHeight +
        premiseDetailsHeight +
        dividerHeight +
        floorPlanTitleHeight

    const remainingHeight = pageUsableHeight - usedHeight

    // Ограничиваем высоту плана этажа строго оставшимся пространством с запасом 14 pt
    return Math.max(100, Math.min(340, Math.floor(remainingHeight - 14)))
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
            ? [kv('Цена за м² от', `${formatPrice(complex.pricePerSqm)} / м²`)]
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

const buildComplexPromoContent = (
    premise: Premise,
    complex?: Complex | null,
) => {
    const { title, features } = parseComplexPromoText(
        complex?.promoText ?? premise.promoText,
    )

    if (!title && features.length === 0) {
        return []
    }

    const content: Record<string, unknown>[] = [
        {
            text: 'Преимущества',
            style: 'sectionTitle',
            margin: [0, 16, 0, 8] as [number, number, number, number],
        },
    ]

    if (title) {
        content.push({
            text: title,
            style: 'fieldValue',
            margin: [0, 0, 0, features.length ? 8 : 0] as [
                number,
                number,
                number,
                number,
            ],
        })
    }

    if (features.length) {
        content.push({
            ul: features,
            style: 'fieldValue',
            margin: [0, 0, 0, 0] as [number, number, number, number],
        })
    }

    return content
}

const sanitizeFileNamePart = (value: string) =>
    value.trim().replace(/[\\/:*?"<>|]/g, '')

const formatProposalFileDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
}

const buildProposalInfoTitle = (items: CommercialProposalItem[]) => {
    const segments = items.map(({ premise, complex }) => {
        const complexName = sanitizeFileNamePart(
            complex?.name || premise.complexName || 'ЖК',
        )
        const number = sanitizeFileNamePart(premise.number)
        return `${number}-${complexName}`
    })

    if (segments.length === 1) {
        return `КП_${segments[0]}`
    }

    return `КП_${segments.join('_')}_${formatProposalFileDate(new Date())}`
}

const PREVIEW_WINDOW_NAME = 'commercial-proposal-preview'

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

const resolvePreviewWindow = (previewWindow?: Window | null): Window | null => {
    if (previewWindow && !previewWindow.closed) {
        return previewWindow
    }

    const namedWindow = window.open('', PREVIEW_WINDOW_NAME)
    if (!namedWindow || namedWindow.closed) {
        return null
    }

    return namedWindow
}

export const openCommercialProposalPreviewWindow = (): Window | null => {
    const previewWindow = window.open('about:blank', PREVIEW_WINDOW_NAME)

    if (!previewWindow) {
        return null
    }

    previewWindow.document.open()
    previewWindow.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <title>Формирование PDF</title>
    <style>
        html, body { margin: 0; height: 100%; font-family: system-ui, sans-serif; }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #374151;
            background: #f9fafb;
        }
    </style>
</head>
<body>Формирование коммерческого предложения…</body>
</html>`)
    previewWindow.document.close()

    return previewWindow
}

const buildProposalPreviewHtml = (pdfUrl: string, fileTitle: string) => {
    const fileName = `${fileTitle}.pdf`
    const safeTitle = escapeHtml(fileTitle)
    const safeFileName = escapeHtml(fileName)

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
        html, body { margin: 0; height: 100%; font-family: system-ui, sans-serif; background: #111827; }
        body { display: flex; flex-direction: column; }
        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 16px;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
        }
        .toolbar-title {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
        }
        .toolbar-hint {
            font-size: 12px;
            color: #6b7280;
        }
        .download-link {
            display: inline-flex;
            align-items: center;
            padding: 8px 14px;
            border-radius: 8px;
            background: #2563eb;
            color: #ffffff;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
        }
        iframe {
            flex: 1;
            width: 100%;
            border: 0;
            background: #111827;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="toolbar-title">${safeTitle}</div>
        <div class="toolbar-actions">
            <span class="toolbar-hint">Для сохранения используйте кнопку справа</span>
            <a class="download-link" href="${pdfUrl}" download="${safeFileName}">Скачать PDF</a>
        </div>
    </div>
    <iframe src="${pdfUrl}" title="${safeTitle}"></iframe>
    <script>
        window.addEventListener('beforeunload', function () {
            URL.revokeObjectURL(${JSON.stringify(pdfUrl)});
        });
    </script>
</body>
</html>`
}

const renderProposalPdfPreview = (
    previewWindow: Window | null | undefined,
    blob: Blob,
    fileTitle: string,
) => {
    const pdfUrl = URL.createObjectURL(blob)
    const previewHtml = buildProposalPreviewHtml(pdfUrl, fileTitle)
    const previewHtmlUrl = URL.createObjectURL(
        new Blob([previewHtml], { type: 'text/html;charset=utf-8' }),
    )
    const targetWindow = resolvePreviewWindow(previewWindow)

    if (!targetWindow) {
        URL.revokeObjectURL(pdfUrl)
        URL.revokeObjectURL(previewHtmlUrl)
        throw new Error('Не удалось открыть окно предпросмотра PDF')
    }

    targetWindow.location.href = previewHtmlUrl
}

const openProposalPdfPreview = async (
    docDefinition: Record<string, unknown>,
    fileTitle: string,
    previewWindow: Window | null | undefined,
) => {
    const blob = await pdfMake.createPdf(docDefinition).getBlob()
    renderProposalPdfPreview(previewWindow, blob, fileTitle)
}

const buildFooter = (manager: CommercialProposalManager) => () => ({
    columns: [
        {
            text: `Агент: ${manager.name || '—'}`,
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
    manager: CommercialProposalManager | undefined,
    previewWindow: Window | null | undefined,
) => {
    if (!items.length) {
        resolvePreviewWindow(previewWindow)?.close()
        return
    }

    const fetchFloorPlanWithOverlayAsDataUrl = async (
        url?: string | null,
        floorPath?: string | null,
    ): Promise<string | null> => {
        if (!url) return null

        try {
            // 1. Получаем картинку как Blob
            const response = await fetch(toAbsoluteUrl(url))
            if (!response.ok) return null
            const blob = await response.blob()

            // Если контура нет, отдаем обычный Data URL
            if (!floorPath) {
                return await new Promise<string | null>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () =>
                        resolve(
                            typeof reader.result === 'string'
                                ? reader.result
                                : null,
                        )
                    reader.onerror = () => resolve(null)
                    reader.readAsDataURL(blob)
                })
            }

            // 2. Создаем HTMLImageElement из Blob
            const blobUrl = URL.createObjectURL(blob)
            try {
                const img = await new Promise<HTMLImageElement>(
                    (resolve, reject) => {
                        const image = new Image()
                        image.onload = () => resolve(image)
                        image.onerror = (e) => reject(e)
                        image.src = blobUrl
                    },
                )

                // 3. Создаем Canvas с оригинальным разрешением изображения
                const canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth || img.width
                canvas.height = img.naturalHeight || img.height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    return fetchImageAsDataUrl(url)
                }

                // 4. Отрисовываем исходный план этажа
                ctx.drawImage(img, 0, 0)

                // 5. Накладываем векторную разметку помещения
                const path2d = new Path2D(floorPath)

                // Полупрозрачная заливка (зеленый акцент или в цвет темы)
                ctx.fillStyle = 'rgba(122, 224, 97, 0.45)'
                ctx.fill(path2d)

                // Контурная обводка помещения
                ctx.strokeStyle = '#22c55e'
                // Толщина линии адаптируется под высокое разрешение картинки
                ctx.lineWidth = Math.max(3, Math.round(canvas.width / 350))
                ctx.lineJoin = 'round'
                ctx.lineCap = 'round'
                ctx.stroke(path2d)

                // 6. Экспортируем изображение с разметкой
                return canvas.toDataURL('image/png')
            } finally {
                URL.revokeObjectURL(blobUrl)
            }
        } catch (error) {
            console.error('Ошибка наложения разметки на план этажа:', error)
            // В случае непредвиденной ошибки возвращаем исходное изображение без разметки
            return fetchImageAsDataUrl(url)
        }
    }

    const prepared = await Promise.all(
        items.map(async (item) => {
            const [layoutImage, floorPlanImage, complexImage] =
                await Promise.all([
                    fetchImageAsDataUrl(resolveLayoutImageUrl(item.premise)),
                    fetchFloorPlanWithOverlayAsDataUrl(
                        resolveFloorPlanImageUrl(item.premise),
                        item.premise.floorPath,
                    ),
                    fetchImageAsDataUrl(
                        resolveComplexImageUrl(item.premise, item.complex),
                    ),
                ])
            return {
                ...item,
                layoutImage,
                floorPlanImage,
                complexImage,
            }
        }),
    )

    const content = prepared.flatMap((item, index) => {
        const premiseFields = buildPremiseFields(item.premise)
        const availableFloorPlanHeight = calculateAvailableFloorPlanHeight(
            index === 0,
            premiseFields.length,
        )

        const block = [
            {
                text: `Коммерческое предложение ${index + 1} из ${prepared.length}`,
                style: 'eyebrow',
                margin: [0, 0, 0, 8] as [number, number, number, number],
            },
            ...buildTwoColumnBlock(
                `Помещение № ${item.premise.number}`,
                buildImageOrPlaceholder(item.layoutImage, 'Планировка'),
                premiseFields,
            ),
            ...(item.floorPlanImage
                ? [
                      sectionDivider(),
                      sectionTitle('План этажа'),
                      buildFullWidthImageBlock(
                          item.floorPlanImage,
                          'План этажа',
                          availableFloorPlanHeight,
                      ),
                      { text: '', pageBreak: 'before' as const },
                  ]
                : [sectionDivider()]),
            ...buildTwoColumnBlock(
                resolveComplexTitle(item.premise, item.complex),
                buildImageOrPlaceholder(item.complexImage, 'Фото ЖК'),
                buildComplexFields(item.premise, item.complex),
            ),
            ...buildComplexPromoContent(item.premise, item.complex),
        ]

        if (index < prepared.length - 1) {
            return [...block, { text: '', pageBreak: 'after' as const }]
        }
        return block
    })

    const docDefinition = {
        info: {
            title: buildProposalInfoTitle(items),
        },
        pageOrientation: 'portrait' as const,
        pageMargins: [40, 36, 40, 48] as [number, number, number, number],
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

    await openProposalPdfPreview(
        docDefinition,
        buildProposalInfoTitle(items),
        previewWindow,
    )
}
