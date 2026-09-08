import { Link } from 'react-router'
import Button from '@/components/ui/Button'
import { TbScale } from 'react-icons/tb'

const ComparisonEmpty = () => {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-800/40 sm:py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TbScale className="text-3xl" />
            </div>
            <h4 className="mb-2 text-xl font-bold heading-text">
                В сравнении пока нет помещений
            </h4>
            <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
                Добавляйте помещения в сравнение с помощью иконки весов в каталоге
                объектов или на шахматке, чтобы сопоставить их планировки, цены и
                характеристики.
            </p>
            <Link to="/objects">
                <Button variant="solid" size="md">
                    Открыть каталог объектов
                </Button>
            </Link>
        </div>
    )
}

export default ComparisonEmpty
