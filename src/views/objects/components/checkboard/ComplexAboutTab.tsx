import { useState } from 'react'
import { TbCalendar, TbMapPin, TbZoomIn } from 'react-icons/tb'
import ImageGallery from '@/components/shared/ImageGallery'
import { DEFAULT_COMPLEX_IMAGE } from '@/mock/data/premisesData'
import type { Complex } from '../../types'

type ComplexAboutTabProps = {
    complex: Complex | null
    fallbackName?: string
    isLoading?: boolean
}

const dash = '—'

const COMPLEX_FEATURES = [
    'Потрясающие виды на лес и реку из панорамных окон.',
    'Закрытая придомовая территория с контролем доступа и КПП с пунктом охраны.',
    'Мини-парк с соснами и разнообразные зоны для отдыха и детских игр на территории.',
    'Фитнес-зал и детская игровая в комплексе.',
    'Собственная котельная и система центрального кондиционирования.',
    'Дистанционное снятие показаний счётчиков.',
    'Дом сдан.',
]

const ComplexAboutTab = ({
    complex,
    fallbackName,
    isLoading = false,
}: ComplexAboutTabProps) => {
    const [previewIndex, setPreviewIndex] = useState(-1)

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
                Загрузка информации...
            </div>
        )
    }

    const name = complex?.name || fallbackName || dash
    const image = complex?.image || DEFAULT_COMPLEX_IMAGE
    const address = complex?.address?.trim() || dash
    const completionDate = complex?.completionDate?.trim() || 'Не указано'

    return (
        <>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
                        <button
                            type="button"
                            className="group relative aspect-[4/3] w-full shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700 lg:w-[min(100%,420px)] lg:self-start"
                            onClick={() => setPreviewIndex(0)}
                        >
                            <img
                                src={image}
                                alt={name}
                                className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                                loading="lazy"
                            />
                            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <TbZoomIn className="text-sm" />
                                Увеличить
                            </span>
                        </button>

                        <div className="min-w-0 flex-1 space-y-5">
                            <div>
                                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {name}
                                </h4>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    О жилом комплексе
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-900/40">
                                    <div className="flex items-start gap-2.5">
                                        <TbMapPin className="mt-0.5 shrink-0 text-lg text-gray-400" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                Адрес
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {address}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-900/40">
                                    <div className="flex items-start gap-2.5">
                                        <TbCalendar className="mt-0.5 shrink-0 text-lg text-gray-400" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                Окончание строительства
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {completionDate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-5 dark:border-gray-700">
                                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Особенности
                                </h5>
                                <ul className="mt-3 space-y-2.5">
                                    {COMPLEX_FEATURES.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                                        >
                                            <span
                                                aria-hidden
                                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                            />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ImageGallery
                index={previewIndex}
                slides={[{ src: image, alt: name }]}
                onClose={() => setPreviewIndex(-1)}
            />
        </>
    )
}

export default ComplexAboutTab
