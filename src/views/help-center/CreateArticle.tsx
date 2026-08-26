import { useState } from 'react'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Card from '@/components/ui/Card'
import EditArticleHeader from './components/EditArticleHeader'
import EditArticleBody from './components/EditArticleBody'
import ArticleEditorHints from './components/ArticleEditorHints'
import ArticleFormActions from './components/ArticleFormActions'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { apiCreateSupportHubArticle } from '@/services/HelpCenterService'
import { useNavigate } from 'react-router'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import classNames from '@/utils/classNames'
import { usePublicationKind } from './publicationKind'

const CreateArticle = () => {
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const [title, setTitle] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [content, setContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
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
            const article = await apiCreateSupportHubArticle({
                data: {
                    title: title.trim(),
                    previewText: previewText.trim(),
                    content,
                    type: kind.type,
                },
            })
            toast.push(
                <Notification type="success">{kind.createSuccess}</Notification>,
                { placement: 'top-end' },
            )
            navigate(`${kind.basePath}/${article.id}`)
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(error, kind.createError)}
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
            </Card>
            <ArticleFormActions
                saveLabel="Создать"
                isSaving={isSaving}
                onBack={() => navigate(kind.basePath)}
                onSave={() => void handleSave()}
            />
        </div>
    )
}

export default CreateArticle
