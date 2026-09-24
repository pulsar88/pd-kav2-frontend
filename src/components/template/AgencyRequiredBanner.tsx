import Button from '@/components/ui/Button'
import { useSessionUser } from '@/store/authStore'
import { isContentManagerOnly } from '@/constants/roles.constant'
import type { JoinAgencyRequest } from '@/@types/agency'
import { TbAlertTriangle, TbBuilding, TbClock, TbX } from 'react-icons/tb'

type AgencyRequiredBannerProps = {
    latestAgencyRequest?: JoinAgencyRequest | null
    isAgencyRequestLoading?: boolean
    onActionClick?: () => void
    onCancelClick?: () => void
}

const AgencyRequiredBanner = ({
    latestAgencyRequest,
    isAgencyRequestLoading = false,
    onActionClick,
    onCancelClick,
}: AgencyRequiredBannerProps) => {
    const user = useSessionUser((state) => state.user)
    const authority = user.authority ?? []

    if (isContentManagerOnly(authority)) {
        return null
    }

    const hasAgency = Boolean(user.agency || user.agencyName)
    if (hasAgency) {
        return null
    }

    const isPending = latestAgencyRequest?.status === 'pending'
    const targetAgencyName = latestAgencyRequest?.agency?.name

    if (isPending) {
        return (
            <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/10 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-full bg-sky-100 p-2.5 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                            <TbClock className="text-xl" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                                Заявка на присоединение отправлена
                            </h4>
                            <p className="mt-0.5 text-xs text-sky-700 dark:text-sky-300/90">
                                {targetAgencyName ? (
                                    <>Ожидайте одобрения заявки руководителем агентства <b>«{targetAgencyName}»</b>.</>
                                ) : (
                                    'Ожидайте одобрения заявки руководителем агентства.'
                                )}{' '}
                                После подтверждения вам откроется полный доступ к кабинету.
                            </p>
                        </div>
                    </div>
                    {onCancelClick ? (
                        <Button
                            size="sm"
                            type="button"
                            className="w-full shrink-0 sm:w-auto"
                            customColorClass={() =>
                                'border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10'
                            }
                            icon={<TbX />}
                            disabled={isAgencyRequestLoading}
                            onClick={onCancelClick}
                        >
                            Отменить заявку
                        </Button>
                    ) : null}
                </div>
            </div>
        )
    }

    return (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        <TbAlertTriangle className="text-xl" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                            Необходимо вступить в агентство
                        </h4>
                        <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300/90">
                            Для работы с фиксациями, объектами и клиентами отправьте заявку на присоединение к агентству.
                        </p>
                    </div>
                </div>
                {onActionClick ? (
                    <Button
                        size="sm"
                        variant="solid"
                        className="w-full shrink-0 bg-amber-600 hover:bg-amber-700 sm:w-auto"
                        icon={<TbBuilding />}
                        disabled={isAgencyRequestLoading}
                        onClick={onActionClick}
                    >
                        Выбрать агентство
                    </Button>
                ) : null}
            </div>
        </div>
    )
}

export default AgencyRequiredBanner
