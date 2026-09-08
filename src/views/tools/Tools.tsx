import Card from '@/components/ui/Card'
import Container from '@/components/shared/Container'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import classNames from '@/utils/classNames'
import { useNavigate } from 'react-router'
import { PiCalculatorDuotone } from 'react-icons/pi'
import type { ReactNode } from 'react'

type ToolCard = {
    id: string
    title: string
    description: string
    path: string
    icon: ReactNode
}

const tools: ToolCard[] = [
    {
        id: 'mortgage-calculator',
        title: 'Ипотечный калькулятор',
        description:
            'Рассчитайте ежемесячный платёж, переплату и график выплат по ипотеке',
        path: '/tools/mortgage-calculator',
        icon: <PiCalculatorDuotone />,
    },
]

const Tools = () => {
    const navigate = useNavigate()

    return (
        <>
            <section className="flex h-[200px] flex-col justify-center bg-primary/10 dark:bg-primary/20 sm:h-[220px]">
                <Container>
                    <div className="px-6 text-center">
                        <h2 className="mb-2">Инструменты</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                            Полезные калькуляторы и сервисы для работы агента
                        </p>
                    </div>
                </Container>
            </section>

            <div
                className={classNames(
                    'my-12 min-w-0 w-full',
                    PAGE_CONTAINER_GUTTER_X,
                )}
            >
                <Card className="w-full">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {tools.map((tool) => (
                            <div
                                key={tool.id}
                                className="group cursor-pointer rounded-xl border border-transparent bg-gray-100 p-8 transition-colors hover:border-primary/40 hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/15"
                                role="button"
                                onClick={() => navigate(tool.path)}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className="rounded-full bg-white p-4 shadow-sm transition-colors group-hover:bg-primary/10 dark:bg-gray-800">
                                        <span className="text-2xl text-primary">
                                            {tool.icon}
                                        </span>
                                    </div>
                                    <h4 className="heading-text mt-3 text-center font-bold">
                                        {tool.title}
                                    </h4>
                                    <p className="min-h-[50px] max-w-[280px] text-center text-gray-600 dark:text-gray-300">
                                        {tool.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </>
    )
}

export default Tools
