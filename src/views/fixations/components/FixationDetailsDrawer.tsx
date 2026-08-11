import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import Button from '@/components/ui/Button'
import Drawer from '@/components/ui/Drawer'
import { TbExternalLink } from 'react-icons/tb'
import type { Fixation } from '../types'
import { fixationStatusMap, formatFixationDate } from '../utils'

type FixationDetailsDrawerProps = {
    isOpen: boolean
    fixation: Fixation | null
    onClose: () => void
}

const InfoRow = ({
    label,
    value,
}: {
    label: string
    value: ReactNode
}) => (
    <div className="flex items-start justify-between gap-4 py-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <div className="max-w-[60%] text-right text-sm font-medium text-gray-900 dark:text-gray-100">
            {value || '—'}
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
    <div>
        <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            {title}
        </h4>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {children}
        </div>
    </div>
)

const FixationDetailsDrawer = ({
    isOpen,
    fixation,
    onClose,
}: FixationDetailsDrawerProps) => {
    const navigate = useNavigate()
    const status = fixation ? fixationStatusMap[fixation.status] : null

    const handleOpenPage = () => {
        if (!fixation) return
        onClose()
        navigate(`/fixations/${fixation.id}`)
    }

    return (
        <Drawer
            isOpen={isOpen}
            title={fixation?.id ? `Фиксация #${fixation.id}` : 'Фиксация'}
            width={420}
            placement="right"
            showBackdrop={false}
            shouldCloseOnOverlayClick={false}
            closeTimeoutMS={300}
            overlayClassName="bg-transparent pointer-events-none"
            lockScroll={false}
            className="pointer-events-auto"
            bodyClass="overflow-y-auto"
            onClose={onClose}
            onRequestClose={onClose}
        >
            <div
                className="flex flex-col gap-6 pb-4"
                onClick={(event) => event.stopPropagation()}
            >
                {!fixation ? (
                    <div className="flex justify-center py-12 text-sm text-gray-500 dark:text-gray-400">
                        Не удалось загрузить фиксацию
                    </div>
                ) : (
                    <>
                        <Button
                            variant="solid"
                            className="w-full"
                            icon={<TbExternalLink />}
                            onClick={handleOpenPage}
                        >
                            Открыть страницу фиксации
                        </Button>

                        <Section title="Основное">
                            <InfoRow
                                label="Статус"
                                value={
                                    status ? (
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    ) : (
                                        '—'
                                    )
                                }
                            />
                            <InfoRow
                                label="Объект"
                                value={fixation.objectName}
                            />
                            <InfoRow
                                label="Проект"
                                value={fixation.projectName}
                            />
                            <InfoRow
                                label="Дата создания"
                                value={formatFixationDate(fixation.createdAt)}
                            />
                            <InfoRow
                                label="Дата истечения"
                                value={formatFixationDate(fixation.expiresAt)}
                            />
                        </Section>

                        <Section title="Контакты агента">
                            <InfoRow
                                label="Email"
                                value={fixation.agent.email}
                            />
                            <InfoRow
                                label="Имя"
                                value={fixation.agent.fullName}
                            />
                            <InfoRow
                                label="Телефон"
                                value={fixation.agent.phone}
                            />
                            <InfoRow
                                label="Агентство"
                                value={fixation.agent.agency}
                            />
                        </Section>

                        <Section title="Контакты клиента">
                            <InfoRow label="Имя" value={fixation.fullName} />
                            <InfoRow label="Телефон" value={fixation.phone} />
                        </Section>

                        <Section title="Объект">
                            <InfoRow
                                label="Объект"
                                value={fixation.objectName}
                            />
                            <InfoRow
                                label="Проект"
                                value={fixation.projectName}
                            />
                            <InfoRow
                                label="ID объекта"
                                value={fixation.objectId}
                            />
                            {fixation.apartment ? (
                                <InfoRow
                                    label="Квартира"
                                    value={fixation.apartment}
                                />
                            ) : null}
                        </Section>

                        <Section title="CRM">
                            <InfoRow
                                label="Лид создан"
                                value={fixation.crm.leadCreated ? 'Да' : 'Нет'}
                            />
                            <InfoRow
                                label="ID лида"
                                value={fixation.crm.leadExternalId ?? '—'}
                            />
                        </Section>
                    </>
                )}
            </div>
        </Drawer>
    )
}

export default FixationDetailsDrawer
