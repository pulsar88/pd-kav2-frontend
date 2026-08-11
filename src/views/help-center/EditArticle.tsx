import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Loading from '@/components/shared/Loading'
import EditArticleHeader from './components/EditArticleHeader'
import EditArticleBody from './components/EditArticleBody'
import {
    apiGetSupportHubArticle,
    apiUpdateSupportHubArticle,
} from '@/services/HelpCenterService'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { TbArrowNarrowLeft, TbDeviceFloppy } from 'react-icons/tb'
import type { GetSupportHubArticleResponse } from './types'

const EditArticle = () => {
    const { topic, id } = useParams()
    const navigate = useNavigate()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState<{ id: string; label: string }[]>([])
    const [isSaving, setIsSaving] = useState(false)

    const articlePath =
        topic && id ? `/help/${topic}/${id}` : id ? `/help/${id}` : '/help'

    const { data, isLoading } = useSWR(
        id ? [`/helps/articles/${id}`, { id }] : null,
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
        setContent(data.content)
        setTags(data.tags || [])
    }, [data])

    const handleSave = async () => {
        if (!id) return
        setIsSaving(true)
        try {
            await apiUpdateSupportHubArticle({
                id,
                data: { title, content, tags },
            })
            toast.push(
                <Notification type="success">Статья сохранена</Notification>,
                { placement: 'top-end' },
            )
            navigate(articlePath)
        } catch {
            toast.push(
                <Notification type="danger">
                    Не удалось сохранить статью
                </Notification>,
                { placement: 'top-end' },
            )
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6">
            <Loading loading={isLoading}>
                {data ? (
                    <div className="flex flex-col gap-4">
                        <EditArticleHeader
                            title={title}
                            authors={data.authors}
                            updateTime={data.updateTime}
                            tags={tags}
                            onTitleChange={setTitle}
                            onTagsChange={setTags}
                        />
                        <EditArticleBody
                            content={content}
                            onChange={setContent}
                        />
                    </div>
                ) : null}
            </Loading>

            <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4">
                    <Button
                        variant="plain"
                        icon={<TbArrowNarrowLeft />}
                        onClick={() => navigate(articlePath)}
                    >
                        Назад
                    </Button>
                    <Button
                        variant="solid"
                        icon={<TbDeviceFloppy />}
                        loading={isSaving}
                        onClick={() => void handleSave()}
                    >
                        Сохранить
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default EditArticle
