import { useEffect, useState } from 'react'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Loading from '@/components/shared/Loading'
import Card from '@/components/ui/Card'
import EditArticleHeader from './components/EditArticleHeader'
import EditArticleBody from './components/EditArticleBody'
import ArticleEditorHints from './components/ArticleEditorHints'
import ArticleFormActions from './components/ArticleFormActions'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    apiGetSupportHubArticle,
    apiUpdateSupportHubArticle,
} from '@/services/HelpCenterService'
import { useNavigate, useParams } from 'react-router'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import classNames from '@/utils/classNames'
import { usePublicationKind } from './publicationKind'
import type { GetSupportHubArticleResponse } from './types'

const EditArticle = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const [title, setTitle] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [content, setContent] = useState('')
    const [articleCode, setArticleCode] = useState<string>()
    const [isSaving, setIsSaving] = useState(false)
    const [data, setData] = useState<GetSupportHubArticleResponse | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(id))

    const itemPath = id ? `${kind.basePath}/${id}` : kind.basePath

    useEffect(() => {
        if (!id) {
            setData(null)
            setIsLoading(false)
            return
        }

        let cancelled = false
        setIsLoading(true)

        void apiGetSupportHubArticle<GetSupportHubArticleResponse>({ id })
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
    }, [id])

    useEffect(() => {
        if (!data) return
        setTitle(data.title)
        setPreviewText(data.previewText || '')
        setContent(data.content)
        setArticleCode(data.code)
    }, [data])

    const handleSave = async () => {
        if (!id) return

        if (!title.trim()) {
            toast.push(
                <Notification type="warning">{kind.titleRequired}</Notification>,
                { placement: 'top-end' },
            )
            return
        }

        if (!previewText.trim()) {
            toast.push(
                <Notification type="warning">
                    {kind.previewRequired}
                </Notification>,
                { placement: 'top-end' },
            )
            return
        }

        setIsSaving(true)
        try {
            await apiUpdateSupportHubArticle({
                id,
                data: {
                    title: title.trim(),
                    previewText: previewText.trim(),
                    content,
                    code: articleCode,
                    type: kind.type,
                },
            })
            toast.push(
                <Notification type="success">{kind.updateSuccess}</Notification>,
                { placement: 'top-end' },
            )
            navigate(itemPath)
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(error, kind.updateError)}
                </Notification>,
                { placement: 'top-end' },
            )
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div
            className={classNames(
                'flex h-full min-h-[calc(100dvh-10rem)] flex-col py-6',
                PAGE_CONTAINER_GUTTER_X,
            )}
        >
            <Card
                className="flex min-h-0 w-full flex-1 flex-col"
                bodyClass="flex min-h-0 flex-1 flex-col gap-4"
            >
                <Loading loading={isLoading} className="flex flex-1 flex-col gap-4">
                    {data ? (
                        <>
                            <div className="shrink-0 space-y-4">
                                <ArticleEditorHints />
                                <EditArticleHeader
                                    title={title}
                                    previewText={previewText}
                                    onTitleChange={setTitle}
                                    onPreviewTextChange={setPreviewText}
                                />
                            </div>
                            <EditArticleBody
                                fillHeight
                                content={content}
                                onChange={setContent}
                            />
                        </>
                    ) : null}
                </Loading>
            </Card>
            <ArticleFormActions
                saveLabel="Сохранить"
                isSaving={isSaving}
                onBack={() => navigate(itemPath)}
                onSave={() => void handleSave()}
            />
        </div>
    )
}

export default EditArticle
