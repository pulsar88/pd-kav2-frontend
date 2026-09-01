import Container from '@/components/shared/Container'
import classNames from '@/utils/classNames'
import { APP_NAME } from '@/constants/app.constant'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'

export type FooterPageContainerType = 'gutterless' | 'contained'

type FooterProps = {
    pageContainerType: FooterPageContainerType
    className?: string
}

const FooterContent = () => {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 w-full py-2 lg:py-0">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center lg:text-left leading-relaxed">
                © {`${new Date().getFullYear()}`}{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                    {`${APP_NAME}`}
                </span>
                . Все права защищены.
            </span>
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm">
                <a
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
                    href="/#"
                    onClick={(e) => e.preventDefault()}
                >
                    Условия использования
                </a>
                <span className="text-gray-300 dark:text-gray-600 select-none">
                    |
                </span>
                <a
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
                    href="/#"
                    onClick={(e) => e.preventDefault()}
                >
                    Политика конфиденциальности
                </a>
            </div>
        </div>
    )
}

export default function Footer({
    pageContainerType = 'contained',
    className,
}: FooterProps) {
    return (
        <footer
            className={classNames(
                `footer flex flex-auto items-center min-h-[4rem] py-3 lg:py-0 ${PAGE_CONTAINER_GUTTER_X}`,
                className,
            )}
        >
            {pageContainerType === 'contained' ? (
                <Container>
                    <FooterContent />
                </Container>
            ) : (
                <FooterContent />
            )}
        </footer>
    )
}
