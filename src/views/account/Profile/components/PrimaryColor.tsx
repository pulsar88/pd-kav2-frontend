import classNames from '@/utils/classNames'
import { TbCheck, TbPalette } from 'react-icons/tb'
import ModeSwitcher from '@/components/template/ThemeConfigurator/ModeSwitcher'
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
        <div>
            <div className="mb-3 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <TbPalette className="text-lg" />
                <span className="text-xs font-medium uppercase tracking-wide">
                    Оформление
                </span>
            </div>
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Тема
                </span>
                <ModeSwitcher />
            </div>
            <div className="flex flex-wrap gap-2">
                {primaryColorOptions.map((option) => {
                    const color =
                        presetThemeSchemaConfig[option.key]?.[mode]?.primary
                    const isSelected = schema === option.key

                    return (
                        <button
                            key={option.key}
                            type="button"
                            aria-label={option.label}
                            title={option.label}
                            className={classNames(
                                'flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:scale-105',
                                option.key === 'gray'
                                    ? 'border-gray-300'
                                    : 'border-white',
                                isSelected &&
                                    'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800',
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setSchema(option.key)}
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
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default PrimaryColor
