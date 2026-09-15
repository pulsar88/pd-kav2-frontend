import { useEffect, useRef, useState } from 'react'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Loading from '@/components/shared/Loading'
import Card from '@/components/ui/Card'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import EditArticleHeader from './components/EditArticleHeader'
import EditArticleBody from './components/EditArticleBody'
import ArticleEditorHints from './components/ArticleEditorHints'
import ArticleFormActions from './components/ArticleFormActions'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    apiDeleteNewsMedia,
    apiGetSupportHubArticle,
    apiUpdateSupportHubArticle,
    apiUploadNewsMedia,
} from '@/services/HelpCenterService'
import {
    extractFileNameFromSrc,
    extractImageSourcesFromHtml,
} from './helpCenterContent'
import { useNavigate, useParams } from 'react-router'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import classNames from '@/utils/classNames'
import { usePublicationKind } from './publicationKind'
import { buildItemSlug, parseItemSlug } from './itemSlug'
import type { GetSupportHubArticleResponse } from './types'

const EditArticle = () => {
    const { slug } = useParams()
    const navigate = useNavigate()
    const kind = usePublicationKind()
    // URL вида "{id}-{code}": id берём из первого сегмента,
    // запрос на запись идёт по нему
    const resolvedId = parseItemSlug(slug ?? '').id
    const [title, setTitle] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [content, setContent] = useState('')
    const [articleCode, setArticleCode] = useState<string>()
    const [isSaving, setIsSaving] = useState(false)
    const [savingAsDraft, setSavingAsDraft] = useState(false)
    const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false)
    const [pendingNotify, setPendingNotify] = useState<boolean | null>(null)
    const [data, setData] = useState<GetSupportHubArticleResponse | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(resolvedId))

    // Отслеживаем исходные картинки и картинки, загруженные в текущей сессии
    const initialImagesRef = useRef<Set<string>>(new Set())
    const uploadedImagesRef = useRef<Set<string>>(new Set())

    const itemPath = slug ? `${kind.basePath}/${slug}` : kind.basePath

    useEffect(() => {
        if (!resolvedId) {
            setData(null)
            setIsLoading(false)
            return
        }

        let cancelled = false
        setIsLoading(true)

        void apiGetSupportHubArticle<GetSupportHubArticleResponse>({
            id: resolvedId,
        })
            .then((article) => {
                if (!cancelled) {
                    setData(article)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setData(null)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [resolvedId])

    useEffect(() => {
        if (!data) return
        setTitle(data.title)
        setPreviewText(data.previewText || '')
        setContent(data.content)
        setArticleCode(data.code)
        initialImagesRef.current = new Set(
            extractImageSourcesFromHtml(data.content || ''),
        )
        uploadedImagesRef.current = new Set()
    }, [data])

    const handleUploadImage = async (file: File) => {
        if (!data?.id) throw new Error('Запись не найдена')
        const url = await apiUploadNewsMedia({ newsId: data.id, file })
        uploadedImagesRef.current.add(url)
        return url
    }

    const validateBeforeSave = () => {
        if (!title.trim()) {
            toast.push(
                <Notification type="warning">{kind.titleRequired}</Notification>,
                { placement: 'top-end' },
            )
            return false
        }

        if (!previewText.trim()) {
            toast.push(
                <Notification type="warning">
                    {kind.previewRequired}
                </Notification>,
                { placement: 'top-end' },
            )
            return false
        }

        return true
    }

    const handleSave = async (asDraft: boolean, notify: boolean) => {
        // PUT по реальному числовому id из полученной записи
        if (!data?.id) return
        if (!validateBeforeSave()) return

        setIsNotifyDialogOpen(false)
        setIsSaving(true)
        setSavingAsDraft(asDraft)
        setPendingNotify(asDraft ? null : notify)
        try {
            // Удаляем с бэкенда картинки, которые были удалены из верстки
            const finalImages = new Set(extractImageSourcesFromHtml(content))
            const allCandidateImages = new Set([
                ...Array.from(initialImagesRef.current),
                ...Array.from(uploadedImagesRef.current),
            ])
            const removedImages = Array.from(allCandidateImages).filter(
                (src) => !finalImages.has(src),
            )

            if (removedImages.length > 0) {
                const fileNames = removedImages.map((src) =>
                    extractFileNameFromSrc(src),
                )
                try {
                    await apiDeleteNewsMedia({
                        newsId: data.id,
                        file: fileNames.length === 1 ? fileNames[0] : fileNames,
                    })
                } catch (deleteError) {
                    console.error(
                        'Failed to delete removed images on server:',
                        deleteError,
                    )
                }
            }

            await apiUpdateSupportHubArticle({
                id: data.id,
                data: {
                    title: title.trim(),
                    previewText: previewText.trim(),
                    content,
                    code: articleCode,
                    type: kind.type,
                    isDraft: asDraft,
                    notify,
                },
            })
            toast.push(
                <Notification type="success">
                    {asDraft ? 'Сохранено как черновик' : kind.updateSuccess}
                </Notification>,
                { placement: 'top-end' },
            )
            const targetSlug = buildItemSlug(data.id, articleCode)
            navigate(`${kind.basePath}/${targetSlug}`)
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(error, kind.updateError)}
                </Notification>,
                { placement: 'top-end' },
            )
        } finally {
            setIsSaving(false)
            setPendingNotify(null)
        }
    }

    const handleSaveDraft = () => {
        void handleSave(true, false)
    }

    const handlePublishClick = () => {
        if (!data?.id) return
        if (!validateBeforeSave()) return
        setIsNotifyDialogOpen(true)
    }

    return (
        <div
            className={classNames(
                'flex h-[calc(100dvh-10rem)] flex-col overflow-hidden py-6',
                PAGE_CONTAINER_GUTTER_X,
            )}
        >
            <Card
                className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
                bodyClass="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
            >
                <Loading
                    type="cover"
                    loading={isLoading}
                    className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
                >
                    {data ? (
                        <>
                            <div className="shrink-0 space-y-4">
                                <ArticleEditorHints />
                                <EditArticleHeader
                                    title={title}
                                    previewText={previewText}
                                    onTitleChange={setTitle}
                                    onPreviewTextChange={setPreviewText}
                                    isDraft={data.isDraft}
                                />
                            </div>
                            <EditArticleBody
                                fillHeight
                                content={content}
                                onChange={setContent}
                                newsId={data.id}
                                onUploadImage={handleUploadImage}
                            />
                        </>
                    ) : null}
                </Loading>
            </Card>
            <ArticleFormActions
                isSaving={isSaving}
                savingAsDraft={savingAsDraft}
                onBack={() => navigate(itemPath)}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublishClick}
            />
            <Dialog
                isOpen={isNotifyDialogOpen}
                width={480}
                onClose={() => setIsNotifyDialogOpen(false)}
                onRequestClose={() => setIsNotifyDialogOpen(false)}
            >
                <h5 className="mb-2">Уведомить пользователей?</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Отправить уведомление всем пользователям проекта о публикации{' '}
                    {kind.itemNameGenitive}?
                </p>
                <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">
                    Пользователей может быть много — уведомление получат все.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                    <Button
                        variant="plain"
                        disabled={isSaving}
                        onClick={() => setIsNotifyDialogOpen(false)}
                    >
                        Отмена
                    </Button>
                    <Button
                        variant="default"
                        disabled={isSaving}
                        loading={isSaving && pendingNotify === false}
                        onClick={() => void handleSave(false, false)}
                    >
                        Без уведомления
                    </Button>
                    <Button
                        variant="solid"
                        disabled={isSaving}
                        loading={isSaving && pendingNotify === true}
                        onClick={() => void handleSave(false, true)}
                    >
                        Уведомить всех
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default EditArticle
