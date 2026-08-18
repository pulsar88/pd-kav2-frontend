import { useState } from 'react'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import EditArticleHeader from './components/EditArticleHeader'
import EditArticleBody from './components/EditArticleBody'
import ArticleFormActions from './components/ArticleFormActions'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { apiCreateSupportHubArticle } from '@/services/HelpCenterService'
import { useNavigate } from 'react-router'
import { useSWRConfig } from 'swr'
import { isPublicationListKey } from './helpCenterQuery'
import { usePublicationKind } from './publicationKind'

const CreateArticle = () => {
    const navigate = useNavigate()
    const { mutate } = useSWRConfig()
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
            await mutate(isPublicationListKey(kind.listEndpoint), undefined, {
                revalidate: true,
            })
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
        <>
            <div className="mx-auto w-full min-w-0 max-w-[1200px] pt-6">
                <div className="flex flex-col gap-4">
                    <EditArticleHeader
                        title={title}
                        previewText={previewText}
                        onTitleChange={setTitle}
                        onPreviewTextChange={setPreviewText}
                    />
                    <EditArticleBody content={content} onChange={setContent} />
                </div>
            </div>
            <ArticleFormActions
                saveLabel="Создать"
                isSaving={isSaving}
                onBack={() => navigate(kind.basePath)}
                onSave={() => void handleSave()}
            />
        </>
    )
}

export default CreateArticle
