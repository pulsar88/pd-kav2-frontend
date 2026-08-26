import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Drawer from '@/components/ui/Drawer'
import {
    TbAlignCenter,
    TbBold,
    TbDeviceFloppy,
    TbHeading,
    TbHelp,
    TbList,
    TbPalette,
    TbQuote,
    TbSeparator,
    TbTextSize,
    TbTypography,
} from 'react-icons/tb'
import type { ComponentType, ReactNode } from 'react'
import { usePublicationKind } from '../publicationKind'

const STORAGE_KEY = 'article-editor-hints-seen'

const fieldHints = (itemNameGenitive: string, itemNameGenitivePlural: string) => [
    {
        title: 'Заголовок',
        text: `Название ${itemNameGenitive} в списке и на странице просмотра.`,
    },
    {
        title: 'Превью текст',
        text: `Краткое описание для карточки в списке ${itemNameGenitivePlural}. Обязательное поле, лучше 1–3 предложения.`,
    },
]

const toolbarHints: {
    title: string
    text: string
    icon: ComponentType<{ className?: string }>
}[] = [
    {
        title: 'Жирный, курсив, зачёркнутый',
        text: 'Базовое оформление выделенного текста.',
        icon: TbBold,
    },
    {
        title: 'Цвет и размер',
        text: 'Цвет текста и размер шрифта для выделенного фрагмента.',
        icon: TbPalette,
    },
    {
        title: 'Заголовок',
        text: 'Превращает абзац в заголовок нужного уровня.',
        icon: TbHeading,
    },
    {
        title: 'Цитата и код',
        text: 'Оформление цитаты, инлайн-кода или блока кода.',
        icon: TbQuote,
    },
    {
        title: 'Выравнивание',
        text: 'По левому краю, по центру или по правому краю.',
        icon: TbAlignCenter,
    },
    {
        title: 'Списки и отступы',
        text: 'Маркированный / нумерованный список и вертикальные отступы.',
        icon: TbList,
    },
    {
        title: 'Разделитель',
        text: 'Горизонтальная линия между блоками.',
        icon: TbSeparator,
    },
    {
        title: 'Размер шрифта',
        text: 'Меняет размер выделенного текста.',
        icon: TbTextSize,
    },
]

const HintCard = ({
    title,
    text,
    icon: Icon,
}: {
    title: string
    text: string
    icon?: ComponentType<{ className?: string }>
}) => (
    <div className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/70">
        {Icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm dark:bg-gray-900">
                <Icon className="text-lg" />
            </span>
        ) : null}
        <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {title}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                {text}
            </p>
        </div>
    </div>
)

const Section = ({
    title,
    children,
}: {
    title: string
    children: ReactNode
}) => (
    <section className="space-y-2.5">
        <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
        </h5>
        {children}
    </section>
)

const markHintsSeen = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
}

const ArticleEditorHints = () => {
    const kind = usePublicationKind()
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY) === 'true') return
        setIsOpen(true)
    }, [])

    const handleClose = () => {
        markHintsSeen()
        setIsOpen(false)
    }

    const handleOpen = () => {
        setIsOpen(true)
    }

    return (
        <div className="flex shrink-0 justify-end">
            <Button
                type="button"
                size="sm"
                variant="solid"
                icon={<TbHelp />}
                className="shrink-0"
                onClick={handleOpen}
            >
                Справка
            </Button>

            <Drawer
                isOpen={isOpen}
                title={
                    <div className="flex items-center gap-2 text-primary">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <TbHelp className="text-xl" />
                        </span>
                        <span className="text-lg font-semibold">
                            Справка по редактору
                        </span>
                    </div>
                }
                width={420}
                placement="right"
                bodyClass="overflow-y-auto"
                onClose={handleClose}
                onRequestClose={handleClose}
            >
                <div className="flex flex-col gap-6 pb-2">
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        Краткая инструкция по созданию и редактированию{' '}
                        {kind.itemNameGenitivePlural}. Выделите текст или
                        поставьте курсор в абзац, затем нажмите кнопку на
                        панели.
                    </p>

                    <Section title="Поля">
                        <div className="space-y-2">
                            {fieldHints(
                                kind.itemNameGenitive,
                                kind.itemNameGenitivePlural,
                            ).map((hint) => (
                                <HintCard
                                    key={hint.title}
                                    title={hint.title}
                                    text={hint.text}
                                    icon={TbTypography}
                                />
                            ))}
                        </div>
                    </Section>

                    <Section title="Панель форматирования">
                        <div className="space-y-2">
                            {toolbarHints.map((hint) => (
                                <HintCard
                                    key={hint.title}
                                    title={hint.title}
                                    text={hint.text}
                                    icon={hint.icon}
                                />
                            ))}
                        </div>
                    </Section>

                    <Section title="Сохранение">
                        <div className="space-y-2">
                            <HintCard
                                title="Назад"
                                text="Вернуться без сохранения текущих изменений."
                            />
                            <HintCard
                                title="Создать / Сохранить"
                                text={`Отправить ${kind.itemName} на сервер. Без заголовка и превью сохранить нельзя.`}
                                icon={TbDeviceFloppy}
                            />
                        </div>
                    </Section>

                    <Button
                        variant="solid"
                        className="w-full"
                        onClick={handleClose}
                    >
                        Понятно
                    </Button>
                </div>
            </Drawer>
        </div>
    )
}

export default ArticleEditorHints
