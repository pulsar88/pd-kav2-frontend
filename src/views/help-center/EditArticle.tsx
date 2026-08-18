import { useEffect, useState } from 'react'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Loading from '@/components/shared/Loading'
import EditArticleHeader from './components/EditArticleHeader'
import EditArticleBody from './components/EditArticleBody'
import ArticleFormActions from './components/ArticleFormActions'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import {
    apiGetSupportHubArticle,
    apiUpdateSupportHubArticle,
} from '@/services/HelpCenterService'
import { useNavigate, useParams } from 'react-router'
import useSWR, { useSWRConfig } from 'swr'
import {
    isPublicationListKey,
    publicationItemKey,
} from './helpCenterQuery'
import { usePublicationKind } from './publicationKind'
import type { GetSupportHubArticleResponse } from './types'

const EditArticle = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { mutate } = useSWRConfig()
    const kind = usePublicationKind()
    const [title, setTitle] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [content, setContent] = useState('')
    const [articleCode, setArticleCode] = useState<string>()
    const [isSaving, setIsSaving] = useState(false)

    const itemPath = id ? `${kind.basePath}/${id}` : kind.basePath

    const { data, isLoading } = useSWR(
        id ? publicationItemKey(id) : null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, params]) =>
            apiGetSupportHubArticle<GetSupportHubArticleResponse>(params),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
        },
    )

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
            await mutate(isPublicationListKey(kind.listEndpoint), undefined, {
                revalidate: true,
            })
            if (id) {
                await mutate(publicationItemKey(id), undefined, {
                    revalidate: true,
                })
            }
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
        <>
            <div className="mx-auto w-full min-w-0 max-w-[1200px] pt-6">
                <Loading loading={isLoading}>
                    {data ? (
                        <div className="flex flex-col gap-4">
                            <EditArticleHeader
                                title={title}
                                previewText={previewText}
                                onTitleChange={setTitle}
                                onPreviewTextChange={setPreviewText}
                            />
                            <EditArticleBody
                                content={content}
                                onChange={setContent}
                            />
                        </div>
                    ) : null}
                </Loading>
            </div>
            <ArticleFormActions
                saveLabel="Сохранить"
                isSaving={isSaving}
                onBack={() => navigate(itemPath)}
                onSave={() => void handleSave()}
            />
        </>
    )
}

export default EditArticle
