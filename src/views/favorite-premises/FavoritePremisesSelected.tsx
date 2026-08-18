import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'
import { TbChecks, TbFileExport } from 'react-icons/tb'

type FavoritePremisesSelectedProps = {
    selectedCount: number
    isGenerating?: boolean
    onClear: () => void
    onGenerate: () => void
}

const formatSelectedPremisesLabel = (count: number) => {
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 === 1 && mod100 !== 11) return 'помещение'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return 'помещения'
    }
    return 'помещений'
}

const FavoritePremisesSelected = ({
    selectedCount,
    isGenerating = false,
    onClear,
    onGenerate,
}: FavoritePremisesSelectedProps) => {
    return (
        <>
            {selectedCount > 0 && (
                <StickyFooter
                    className="mt-4 flex items-center justify-between bg-white py-4 dark:bg-gray-800"
                    stickyClass="-mx-4 border-t border-gray-200 px-8 dark:border-gray-700 sm:-mx-8"
                    defaultClass="container mx-auto rounded-xl border border-gray-200 px-8 dark:border-gray-600"
                >
                    <div className="container mx-auto">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                <span className="flex items-center gap-2">
                                    <span className="text-lg text-primary">
                                        <TbChecks />
                                    </span>
                                    <span className="font-semibold flex items-center gap-1">
                                        <span className="heading-text">
                                            {selectedCount}{' '}
                                            {formatSelectedPremisesLabel(
                                                selectedCount,
                                            )}
                                        </span>
                                        <span>выбрано</span>
                                    </span>
                                </span>
                            </span>

                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    type="button"
                                    customColorClass={() =>
                                        'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error'
                                    }
                                    onClick={onClear}
                                >
                                    Сбросить
                                </Button>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    type="button"
                                    icon={<TbFileExport />}
                                    loading={isGenerating}
                                    onClick={onGenerate}
                                >
                                    Сформировать КП
                                </Button>
                            </div>
                        </div>
                    </div>
                </StickyFooter>
            )}
        </>
    )
}

export default FavoritePremisesSelected
