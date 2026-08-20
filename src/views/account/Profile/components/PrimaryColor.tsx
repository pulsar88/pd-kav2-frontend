import Card from '@/components/ui/Card'
import classNames from '@/utils/classNames'
import { TbCheck, TbPalette } from 'react-icons/tb'
import { useThemeStore } from '@/store/themeStore'
import presetThemeSchemaConfig from '@/configs/preset-theme-schema.config'

const primaryColorOptions = [
    { key: 'gray', label: 'Серый' },
    { key: 'default', label: 'Синий' },
    { key: 'teal', label: 'Бирюзовый' },
    { key: 'purple', label: 'Фиолетовый' },
    { key: 'rose', label: 'Розовый' },
    { key: 'orange', label: 'Оранжевый' },
] as const

const PrimaryColor = () => {
    const schema = useThemeStore((state) => state.themeSchema)
    const setSchema = useThemeStore((state) => state.setSchema)
    const mode = useThemeStore((state) => state.mode)

    return (
        <Card
            className="h-full flex flex-col"
            bodyClass="flex-1"
            header={{
                content: (
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle text-primary text-xl shrink-0">
                            <TbPalette />
                        </span>
                        <div>
                            <h4 className="mb-1">Цвет интерфейса</h4>
                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                Выберите основной цвет кнопок, ссылок и акцентов
                            </p>
                        </div>
                    </div>
                ),
                bordered: true,
            }}
        >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {primaryColorOptions.map((option) => {
                    const color =
                        presetThemeSchemaConfig[option.key]?.[mode]?.primary
                    const isSelected = schema === option.key

                    return (
                        <button
                            key={option.key}
                            type="button"
                            className={classNames(
                                'flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                                isSelected
                                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                    : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60',
                            )}
                            onClick={() => setSchema(option.key)}
                        >
                            <span
                                className={classNames(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 shadow-sm',
                                    option.key === 'gray'
                                        ? 'border-gray-300'
                                        : 'border-white',
                                    isSelected && 'ring-2 ring-offset-2 ring-primary dark:ring-offset-gray-800',
                                )}
                                style={{ backgroundColor: color }}
                            >
                                {isSelected ? (
                                    <TbCheck
                                        className={classNames(
                                            'text-lg',
                                            option.key === 'gray'
                                                ? 'text-gray-800'
                                                : 'text-white',
                                        )}
                                    />
                                ) : null}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {option.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </Card>
    )
}

export default PrimaryColor
