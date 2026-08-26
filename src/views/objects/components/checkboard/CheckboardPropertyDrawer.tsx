import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
    ImageSlide,
    isImageSlide,
    type RenderSlideProps,
} from 'yet-another-react-lightbox'
import Drawer from '@/components/ui/Drawer'
import { Button, Carousel } from '@/components/ui'
import ImageGallery from '@/components/shared/ImageGallery'
import Loading from '@/components/shared/Loading'
import useResponsive from '@/utils/hooks/useResponsive'
import classNames from '@/utils/classNames'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useFavoritesStore } from '@/store/favoritesStore'
import { apiCheckRealtyCollectionProperties } from '@/services/RealtyCollectionsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    TbChevronDown,
    TbHeart,
    TbHeartFilled,
    TbLayoutGrid,
    TbPlus,
    TbZoomIn,
} from 'react-icons/tb'
import type { FlatCheckboardProperty } from '../../checkboard.types'
import type { Premise } from '../../types'
import {
    buildPremiseFromCheckboardProperty,
    formatCheckboardPrice,
} from '../../checkboardUtils'
import { useThemeStore } from '@/store/themeStore'
import presetThemeSchemaConfig from '@/configs/preset-theme-schema.config'
import { hexToRgba } from '@/utils/hetToRgba'
import { useCommonStore } from '@/store/commonStore'

type CheckboardPropertyDrawerProps = {
    isOpen: boolean
    property: FlatCheckboardProperty | null
    propertyDetails?: Premise | null
    isDetailsLoading?: boolean
    complexId?: string
    complexName?: string
    onClose: () => void
}

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex items-start justify-between gap-4 py-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
            {label}
        </span>
        <div className="max-w-[60%] text-right text-sm font-medium text-gray-900 dark:text-gray-100">
            {value || '—'}
        </div>
    </div>
)

const getImageUrls = (property: FlatCheckboardProperty | null) => {
    if (!property) return []

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

    return urls
}

const LayoutImagePlaceholder = () => (
    <div className="flex h-[240px] w-full flex-col items-center justify-center gap-2 sm:h-[280px]">
        <TbLayoutGrid className="text-3xl text-gray-400 opacity-60" />
        <span className="text-center text-xs text-gray-500">
            Нет планировки
        </span>
    </div>
)

const FloorPlanPathOverlay = ({
    path,
    width,
    height,
    color = '#3b82f6',
}: {
    path: string
    width: number
    height: number
    color: string
}) => (
    <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
    >
        <path d={path} fill={hexToRgba(color)} stroke={color} strokeWidth={4} />
    </svg>
)

const FloorPlanGallerySlide = ({
    slide,
    offset,
    rect,
    floorPath,
    color,
}: RenderSlideProps & {
    floorPath: string
    color: string
}) => {
    if (!isImageSlide(slide)) {
        return null
    }

    const hasSize = Boolean(slide.width && slide.height)

    return (
        <div
            style={{
                position: 'relative',
                ...(hasSize
                    ? {
                          maxWidth: `min(${slide.width}px, 100%)`,
                          maxHeight: `min(${slide.height}px, 100%)`,
                          aspectRatio: `${slide.width} / ${slide.height}`,
                      }
                    : null),
            }}
        >
            <ImageSlide
                slide={slide}
                offset={offset}
                rect={rect}
                style={{
                    display: 'block',
                    ...(hasSize
                        ? {
                              width: '100%',
                              height: 'auto',
                              maxWidth: undefined,
                              maxHeight: undefined,
                          }
                        : null),
                }}
            />
            {hasSize ? (
                <FloorPlanPathOverlay
                    path={floorPath}
                    width={slide.width!}
                    height={slide.height!}
                    color={color}
                />
            ) : null}
        </div>
    )
}

const formatSectionValue = (section?: string, sectionName?: string) => {
    const raw = section ?? sectionName
    if (!raw) return undefined

    return raw.replace(/^секция\s+/i, '').trim() || raw
}

const CheckboardPropertyDrawer = ({
    isOpen,
    property,
    propertyDetails = null,
    isDetailsLoading = false,
    complexId,
    complexName,
    onClose,
}: CheckboardPropertyDrawerProps) => {
    const navigate = useNavigate()
    const { smaller } = useResponsive()
    const isMobile = smaller.md
    const [previewIndex, setPreviewIndex] = useState(-1)
    const [floorPlanPreviewIndex, setFloorPlanPreviewIndex] = useState(-1)
    const [floorPlanSize, setFloorPlanSize] = useState<{
        width: number
        height: number
    } | null>(null)
    const togglePremise = useFavoritesStore((state) => state.togglePremise)
    const setFavoriteIds = useFavoritesStore((state) => state.setFavoriteIds)
    const schema = useThemeStore((state) => state.themeSchema)
    const mode = useThemeStore((state) => state.mode)
    const primaryColor =
        presetThemeSchemaConfig[schema]?.[mode]?.primary ?? '#3b82f6'
    const showFloorPlan = useCommonStore((state) => state.showFloorPlan)
    const setShowFloorPlan = useCommonStore((state) => state.setShowFloorPlan)
    const [isFavoriteChecking, setIsFavoriteChecking] = useState(false)
    const [isFavoriteToggling, setIsFavoriteToggling] = useState(false)

    const favoritePremise = useMemo(() => {
        if (!property) return null

        return buildPremiseFromCheckboardProperty(property, {
            propertyDetails,
            complexId,
            complexName,
        })
    }, [property, propertyDetails, complexId, complexName])

    const isFavorite = useFavoritesStore((state) =>
        favoritePremise
            ? state.favoriteIds.includes(favoritePremise.id)
            : false,
    )

    useEffect(() => {
        if (!isOpen || !favoritePremise) {
            setIsFavoriteChecking(false)
            return
        }

        const propertyId = favoritePremise.id
        let cancelled = false
        setIsFavoriteChecking(true)

        void apiCheckRealtyCollectionProperties([propertyId])
            .then((existsIds) => {
                if (cancelled) return

                const exists = existsIds.includes(propertyId)
                const currentIds = useFavoritesStore.getState().favoriteIds
                const alreadyInStore = currentIds.includes(propertyId)

                if (exists && !alreadyInStore) {
                    setFavoriteIds([...currentIds, propertyId])
                } else if (!exists && alreadyInStore) {
                    setFavoriteIds(
                        currentIds.filter((id) => id !== propertyId),
                    )
                }
            })
            .catch((error) => {
                if (cancelled) return
                toast.push(
                    <Notification type="danger">
                        {getApiErrorMessage(
                            error,
                            'Не удалось проверить избранное',
                        )}
                    </Notification>,
                )
            })
            .finally(() => {
                if (!cancelled) setIsFavoriteChecking(false)
            })

        return () => {
            cancelled = true
        }
    }, [isOpen, favoritePremise?.id, setFavoriteIds])

    const display = useMemo(() => {
        if (!property) return null

        const section = formatSectionValue(
            propertyDetails?.section,
            property.sectionName,
        )
        const number = propertyDetails?.number ?? property.number
        const floor = propertyDetails?.floor ?? property.floor
        const area = propertyDetails?.area ?? property.area
        const goodArea =
            propertyDetails?.goodArea ??
            (property.type.has_good_area ? property.good_area : undefined)
        const roomsCount = propertyDetails?.rooms ?? property.rooms_count
        const typeName = propertyDetails?.typeName ?? property.type.name
        const hasRooms = property.type.has_rooms
        const price =
            propertyDetails?.price ??
            (property.price > 0 ? property.price : undefined)

        return {
            section,
            number,
            floor,
            area,
            goodArea,
            roomsCount,
            typeName,
            hasRooms,
            price,
        }
    }, [property, propertyDetails])

    const imageUrls = useMemo(() => {
        if (propertyDetails?.layoutImage) {
            return [propertyDetails.layoutImage]
        }

        return getImageUrls(property)
    }, [property, propertyDetails?.layoutImage])

    const hasImages = imageUrls.length > 0
    const slides = imageUrls.map((src) => ({ src }))

    useEffect(() => {
        if (!isOpen) {
            setPreviewIndex(-1)
            setFloorPlanPreviewIndex(-1)
        }
    }, [isOpen])

    useEffect(() => {
        setPreviewIndex(-1)
        setFloorPlanPreviewIndex(-1)
        setFloorPlanSize(null)
    }, [property?.id])

    return (
        <>
            <Drawer
                title={`${display?.typeName || property?.type.name || 'Помещение'} №${display?.number || property?.number || ''}`}
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
                        <div className="flex w-full flex-col gap-2">
                            <Button
                                type="button"
                                variant="plain"
                                className={classNames(
                                    'w-full',
                                    isFavorite
                                        ? 'text-rose-500 hover:text-rose-600'
                                        : 'text-gray-600 dark:text-gray-300',
                                )}
                                loading={isFavoriteChecking || isFavoriteToggling}
                                disabled={
                                    !favoritePremise ||
                                    isFavoriteChecking ||
                                    isFavoriteToggling
                                }
                                icon={
                                    isFavorite ? <TbHeartFilled /> : <TbHeart />
                                }
                                onClick={(event) => {
                                    event.stopPropagation()
                                    if (
                                        !favoritePremise ||
                                        isFavoriteChecking ||
                                        isFavoriteToggling
                                    ) {
                                        return
                                    }

                                    setIsFavoriteToggling(true)
                                    void togglePremise(favoritePremise)
                                        .catch((error) => {
                                            toast.push(
                                                <Notification type="danger">
                                                    {getApiErrorMessage(
                                                        error,
                                                        'Не удалось обновить избранное',
                                                    )}
                                                </Notification>,
                                            )
                                        })
                                        .finally(() => {
                                            setIsFavoriteToggling(false)
                                        })
                                }}
                            >
                                {isFavorite
                                    ? 'Убрать из избранного'
                                    : 'Добавить в избранное'}
                            </Button>
                            <Button
                                type="button"
                                variant="solid"
                                className="w-full"
                                icon={<TbPlus />}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    if (!property || !display) return

                                    const params = new URLSearchParams({
                                        create: '1',
                                    })

                                    if (complexId) {
                                        params.set('complexId', complexId)
                                    }

                                    params.set(
                                        'propertyId',
                                        String(property.id),
                                    )
                                    params.set(
                                        'apartmentNumber',
                                        display.number,
                                    )
                                    if (display.hasRooms) {
                                        params.set(
                                            'rooms',
                                            String(
                                                display.roomsCount === 0
                                                    ? 0
                                                    : display.roomsCount,
                                            ),
                                        )
                                    }

                                    navigate(`/fixations?${params.toString()}`)
                                }}
                            >
                                Создать фиксацию
                            </Button>
                        </div>
                    ) : null
                }
            >
                {property && display ? (
                    <div
                        className="space-y-5"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div>
                            <h5 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Изображения
                            </h5>
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white">
                                {hasImages ? (
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
                                                            setPreviewIndex(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <img
                                                            src={src}
                                                            alt={`Изображение помещения №${display.number}`}
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
                                ) : (
                                    <LayoutImagePlaceholder />
                                )}
                            </div>
                        </div>
                        <div>
                            <button
                                type="button"
                                className="flex w-full items-center justify-between gap-3 py-3 text-left"
                                onClick={() => setShowFloorPlan(!showFloorPlan)}
                            >
                                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    План этажа
                                </h5>
                                <TbChevronDown
                                    className={classNames(
                                        'shrink-0 text-lg text-gray-400 transition-transform duration-200',
                                        showFloorPlan && 'rotate-180',
                                    )}
                                />
                            </button>
                            {showFloorPlan ? (
                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-white">
                                    {propertyDetails?.floorPlanImage ? (
                                        <button
                                            type="button"
                                            className="group relative flex h-[240px] w-full cursor-zoom-in items-center justify-center sm:h-[280px]"
                                            onClick={() =>
                                                setFloorPlanPreviewIndex(0)
                                            }
                                        >
                                            <div
                                                key={propertyDetails.id}
                                                className="relative h-full w-full"
                                            >
                                                <img
                                                    src={
                                                        propertyDetails.floorPlanImage
                                                    }
                                                    alt={`План этажа, помещение №${display.number}`}
                                                    className="max-h-full w-full rounded-xl object-contain transition-opacity group-hover:opacity-90"
                                                    loading="lazy"
                                                    onLoad={(event) => {
                                                        const img =
                                                            event.currentTarget
                                                        setFloorPlanSize({
                                                            width: img.naturalWidth,
                                                            height: img.naturalHeight,
                                                        })
                                                    }}
                                                />
                                                {floorPlanSize &&
                                                propertyDetails.floorPath ? (
                                                    <FloorPlanPathOverlay
                                                        path={
                                                            propertyDetails.floorPath
                                                        }
                                                        width={
                                                            floorPlanSize.width
                                                        }
                                                        height={
                                                            floorPlanSize.height
                                                        }
                                                        color="#7ae061ff"
                                                    />
                                                ) : null}
                                            </div>
                                            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                <TbZoomIn className="text-sm" />
                                                Увеличить
                                            </span>
                                        </button>
                                    ) : (
                                        <LayoutImagePlaceholder />
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div>
                            <h5 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Детали помещения
                            </h5>
                            <Loading loading={isDetailsLoading} type="cover">
                                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 px-4 dark:divide-gray-800 dark:border-gray-700">
                                    <InfoRow
                                        label="Секция"
                                        value={display.section}
                                    />
                                    <InfoRow
                                        label="Номер"
                                        value={`№${display.number}`}
                                    />
                                    <InfoRow
                                        label="Этаж"
                                        value={display.floor}
                                    />
                                    <InfoRow
                                        label="Площадь"
                                        value={`${display.area} м²`}
                                    />
                                    <InfoRow
                                        label="Жилая площадь"
                                        value={
                                            display.goodArea !== undefined
                                                ? `${display.goodArea} м²`
                                                : '—'
                                        }
                                    />
                                    <InfoRow
                                        label="Кол-во комнат"
                                        value={
                                            display.hasRooms
                                                ? display.roomsCount
                                                : '—'
                                        }
                                    />
                                    <InfoRow
                                        label="Цена"
                                        value={
                                            display.price != null &&
                                            display.price > 0
                                                ? formatCheckboardPrice(
                                                      display.price,
                                                  )
                                                : '—'
                                        }
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
                                                }}
                                            >
                                                {property.status.name}
                                            </span>
                                        }
                                    />
                                    <InfoRow
                                        label="Тип"
                                        value={display.typeName}
                                    />
                                </div>
                            </Loading>
                        </div>
                    </div>
                ) : null}
            </Drawer>

            {hasImages ? (
                <ImageGallery
                    index={previewIndex}
                    slides={slides}
                    onClose={() => setPreviewIndex(-1)}
                />
            ) : null}

            {propertyDetails?.floorPlanImage ? (
                <ImageGallery
                    index={floorPlanPreviewIndex}
                    slides={[
                        {
                            src: propertyDetails.floorPlanImage,
                            alt: `План этажа, помещение №${display?.number ?? ''}`,
                            ...(floorPlanSize
                                ? {
                                      width: floorPlanSize.width,
                                      height: floorPlanSize.height,
                                  }
                                : null),
                        },
                    ]}
                    render={{
                        slide: (props) => {
                            if (!propertyDetails.floorPath) {
                                return undefined
                            }

                            return (
                                <FloorPlanGallerySlide
                                    {...props}
                                    floorPath={propertyDetails.floorPath}
                                    color="#7ae061ff"
                                />
                            )
                        },
                    }}
                    onClose={() => setFloorPlanPreviewIndex(-1)}
                />
            ) : null}
        </>
    )
}

export default CheckboardPropertyDrawer
