import Container from '@/components/shared/Container'
import Dropdown from '@/components/ui/Dropdown'
import classNames from '@/utils/classNames'
import { APP_NAME } from '@/constants/app.constant'
import { LEGAL_DOC_LINKS } from '@/constants/legalDocs.constant'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import { TbChevronUp } from 'react-icons/tb'

export type FooterPageContainerType = 'gutterless' | 'contained'

type FooterProps = {
    pageContainerType: FooterPageContainerType
    className?: string
}

const FooterContent = () => {
    return (
        <div className="flex w-full flex-col items-center justify-between gap-3 py-2 lg:flex-row lg:py-0">
            <span className="text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400 sm:text-sm lg:text-left">
                © {`${new Date().getFullYear()}`}{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                    {`${APP_NAME}`}
                </span>
                . Все права защищены.
            </span>
            <Dropdown
                placement="top-end"
                menuClass="min-w-[240px] max-w-[calc(100vw-2rem)]"
                toggleClassName="inline-flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 sm:text-sm"
                renderTitle={
                    <span className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap">
                        Документы
                        <TbChevronUp className="text-base opacity-70" />
                    </span>
                }
            >
                {LEGAL_DOC_LINKS.map((doc) => (
                    <Dropdown.Item key={doc.key} eventKey={doc.key} className="px-0">
                        <a
                            className="flex h-full w-full px-3 py-1.5 text-sm"
                            href={doc.href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {doc.label}
                        </a>
                    </Dropdown.Item>
                ))}
            </Dropdown>
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
