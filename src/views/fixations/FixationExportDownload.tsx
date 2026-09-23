import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    apiGetFixationExport,
    apiDownloadFixationExport,
} from '@/services/FixationsService'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { TbFileSpreadsheet, TbArrowLeft, TbDownload } from 'react-icons/tb'

const FixationExportDownload = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const downloadedRef = useRef(false)

    const triggerDownload = async () => {
        if (!id) return
        setIsLoading(true)
        setError(null)
        try {
            let fileName = `fixations_export_${id}.xlsx`
            try {
                const info = await apiGetFixationExport(id)
                if (info?.file?.file_name) {
                    fileName = info.file.file_name
                }
            } catch {
                // Если эндпоинт инфо недоступен, продолжаем со стандартным именем
            }

            await apiDownloadFixationExport(id, fileName)
            setIsSuccess(true)
            toast.push(
                <Notification title="Успешно" type="success">
                    Файл экспорта скачан
                </Notification>,
            )
        } catch (err: unknown) {
            const msg = getApiErrorMessage(err, 'Не удалось скачать файл экспорта')
            setError(msg)
            toast.push(
                <Notification title="Ошибка" type="danger">
                    {msg}
                </Notification>,
            )
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!id || downloadedRef.current) return
        downloadedRef.current = true
        void triggerDownload()
    }, [id])

    return (
        <Container>
            <AdaptiveCard className="max-w-lg mx-auto my-12">
                <div className="flex flex-col items-center justify-center text-center p-6 gap-4">
                    <div className="rounded-full bg-emerald-50 p-4 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <TbFileSpreadsheet className="text-4xl" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Скачивание экспорта #{id}
                    </h3>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
                            <Spinner size={24} />
                            <span>Подготавливаем и скачиваем файл...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-sm text-rose-600 dark:text-rose-400">
                                {error}
                            </p>
                            <Button
                                variant="solid"
                                icon={<TbDownload />}
                                onClick={() => void triggerDownload()}
                            >
                                Повторить скачивание
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                Файл успешно передан на скачивание в вашем браузере.
                            </p>
                            <p className="text-xs text-gray-400">
                                Если скачивание не началось автоматически, нажмите кнопку ниже:
                            </p>
                            <Button
                                size="sm"
                                variant="default"
                                icon={<TbDownload />}
                                onClick={() => void triggerDownload()}
                            >
                                Скачать снова
                            </Button>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            variant="plain"
                            icon={<TbArrowLeft />}
                            onClick={() => navigate('/fixations?tab=export')}
                        >
                            К списку экспортов
                        </Button>
                    </div>
                </div>
            </AdaptiveCard>
        </Container>
    )
}

export default FixationExportDownload
