import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Drawer from '@/components/ui/Drawer'
import { Button, Carousel } from '@/components/ui'
import ImageGallery from '@/components/shared/ImageGallery'
import useResponsive from '@/utils/hooks/useResponsive'
import { TbPlus, TbZoomIn } from 'react-icons/tb'
import type { FlatCheckboardProperty } from '../../checkboard.types'
import { formatCheckboardPrice } from '../../checkboardUtils'
import { DEFAULT_LAYOUT_IMAGE } from '@/mock/data/premisesData'

type CheckboardPropertyDrawerProps = {
    isOpen: boolean
    property: FlatCheckboardProperty | null
    complexId?: string
    onClose: () => void
}

const InfoRow = ({
    label,
    value,
}: {
    label: string
    value: ReactNode
}) => (
    <div className="flex items-start justify-between gap-4 py-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <div className="max-w-[60%] text-right text-sm font-medium text-gray-900 dark:text-gray-100">
            {value || '—'}
        </div>
    </div>
)

const getLayoutTypeLabel = (property: FlatCheckboardProperty | null) => {
    if (!property || !property.type.has_layout_type) return '—'

    if (property.studio && property.euro) return 'Евро-студия'
    if (property.studio) return 'Студия'
    if (property.euro) return 'Евро'
    if (property.free_destination) return 'Свободная'

    return 'Классическая'
}

const getImageUrls = (property: FlatCheckboardProperty | null) => {
    if (!property) return [DEFAULT_LAYOUT_IMAGE]

    const urls = property.plans
        .map((plan) => {
            if (typeof plan === 'string') return plan
            if (!plan || typeof plan !== 'object') return null

            const maybeUrl = [
                'url',
                'src',
                'image',
                'image_url',
                'original_url',
                'path',
            ].find((key) => {
                const value = (plan as Record<string, unknown>)[key]
                return typeof value === 'string' && value.length > 0
            })

            return maybeUrl
                ? ((plan as Record<string, string>)[maybeUrl] ?? null)
                : null
        })
        .filter((value): value is string => Boolean(value))

    return urls.length > 0 ? urls : [DEFAULT_LAYOUT_IMAGE]
}

const CheckboardPropertyDrawer = ({
    isOpen,
    property,
    complexId,
    onClose,
}: CheckboardPropertyDrawerProps) => {
    const navigate = useNavigate()
    const { smaller } = useResponsive()
    const isMobile = smaller.md
    const [previewIndex, setPreviewIndex] = useState(-1)

    const roomsLabel = property
        ? property.type.has_rooms
            ? property.studio
                ? 'Студия'
                : `${property.rooms_count}-комн.`
            : property.type.name
        : '—'
    const layoutTypeLabel = getLayoutTypeLabel(property)
    const imageUrls = getImageUrls(property)
    const roomsCountLabel =
        property && property.type.has_rooms ? property.rooms_count : '—'
    const slides = imageUrls.map((src) => ({ src }))

    useEffect(() => {
        if (!isOpen) {
            setPreviewIndex(-1)
        }
    }, [isOpen])

    useEffect(() => {
        setPreviewIndex(-1)
    }, [property?.id])

    return (
        <>
            <Drawer
                title={`${property?.type.name || 'Помещение'} №${property?.number || ''}`}
                isOpen={isOpen}
                onClose={onClose}
                onRequestClose={onClose}
                width={isMobile ? 375 : 420}
                placement="right"
                showBackdrop={false}
                shouldCloseOnOverlayClick={false}
                closeTimeoutMS={300}
                overlayClassName="bg-transparent pointer-events-none"
                lockScroll={false}
                bodyClass="checkboard-scroll !h-auto min-h-0 flex-1"
                footerClass="shrink-0"
                footer={
                    property ? (
                        <Button
                            type="button"
                            variant="solid"
                            className="w-full"
                            icon={<TbPlus />}
                            onClick={(event) => {
                                event.stopPropagation()
                                if (!property) return

                                const params = new URLSearchParams({
                                    create: '1',
                                })

                                if (complexId) {
                                    params.set('complexId', complexId)
                                }

                                params.set('propertyId', String(property.id))
                                params.set('apartmentNumber', property.number)
                                if (property.type.has_rooms) {
                                    params.set(
                                        'rooms',
                                        String(
                                            property.studio
                                                ? 0
                                                : property.rooms_count,
                                        ),
                                    )
                                }

                                navigate(`/fixations?${params.toString()}`)
                            }}
                        >
                            Создать фиксацию
                        </Button>
                    ) : null
                }
            >
                {property ? (
                    <div
                        className="space-y-5"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div>
                            <h5 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Изображения
                            </h5>
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                                <Carousel
                                    opts={{ loop: imageUrls.length > 1 }}
                                    className="relative"
                                >
                                    <Carousel.Content>
                                        {imageUrls.map((src, index) => (
                                            <Carousel.Item
                                                key={`${src}-${index}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="group relative flex h-[240px] w-full cursor-zoom-in items-center justify-center sm:h-[280px]"
                                                    onClick={() =>
                                                        setPreviewIndex(index)
                                                    }
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`Изображение помещения №${property.number}`}
                                                        className="max-h-full w-full rounded-xl object-contain transition-opacity group-hover:opacity-90"
                                                        loading="lazy"
                                                    />
                                                    <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        <TbZoomIn className="text-sm" />
                                                        Увеличить
                                                    </span>
                                                </button>
                                            </Carousel.Item>
                                        ))}
                                    </Carousel.Content>
                                    {imageUrls.length > 1 ? (
                                        <>
                                            <Carousel.Previous className="absolute left-2 top-1/2 z-10 -translate-y-1/2" />
                                            <Carousel.Next className="absolute right-2 top-1/2 z-10 -translate-y-1/2" />
                                        </>
                                    ) : null}
                                </Carousel>
                            </div>
                        </div>

                        <div>
                            <h5 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Детали помещения
                            </h5>
                            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 px-4 dark:divide-gray-800 dark:border-gray-700">
                                <InfoRow
                                    label="Секция"
                                    value={property.sectionName}
                                />
                                <InfoRow
                                    label="Номер"
                                    value={`№${property.number}`}
                                />
                                <InfoRow label="Этаж" value={property.floor} />
                                <InfoRow
                                    label="Площадь"
                                    value={`${property.area} м²`}
                                />
                                <InfoRow
                                    label="Жилая площадь"
                                    value={
                                        property.type.has_good_area
                                            ? `${property.good_area} м²`
                                            : '—'
                                    }
                                />
                                <InfoRow
                                    label="Кол-во комнат"
                                    value={roomsCountLabel}
                                />
                                <InfoRow
                                    label="Цена"
                                    value={formatCheckboardPrice(
                                        property.price,
                                    )}
                                />
                                <InfoRow
                                    label="Статус"
                                    value={
                                        <span
                                            className="inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold"
                                            style={{
                                                backgroundColor:
                                                    property.status.color,
                                                color: property.status
                                                    .text_color,
                                                border: `1px solid ${property.status.accent_color}`,
                                            }}
                                        >
                                            {property.status.name}
                                        </span>
                                    }
                                />
                                <InfoRow
                                    label="Тип"
                                    value={property.type.name}
                                />
                                <InfoRow
                                    label="Тип планировки"
                                    value={layoutTypeLabel}
                                />
                                <InfoRow
                                    label="Комнатность"
                                    value={roomsLabel}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}
            </Drawer>

            <ImageGallery
                index={previewIndex}
                slides={slides}
                onClose={() => setPreviewIndex(-1)}
            />
        </>
    )
}

export default CheckboardPropertyDrawer
