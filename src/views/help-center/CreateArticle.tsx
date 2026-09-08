import { useState } from 'react'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getApiErrorMessage } from '@/services/auth/authUtils'
import { apiCreateSupportHubArticle } from '@/services/HelpCenterService'
import { useNavigate } from 'react-router'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import classNames from '@/utils/classNames'
import { usePublicationKind } from './publicationKind'
import { buildItemSlug } from './itemSlug'
import { TbArrowNarrowLeft } from 'react-icons/tb'

const CreateArticle = () => {
    const navigate = useNavigate()
    const kind = usePublicationKind()
    const [title, setTitle] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.push(
                <Notification type="warning">
                    {kind.titleRequired}
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
                    type: kind.type,
                },
            })
            toast.push(
                <Notification type="success">
                    {kind.createSuccess}
                </Notification>,
                { placement: 'top-end' },
            )
            const slug = buildItemSlug(article.id, article.code)
            navigate(`${kind.basePath}/${slug}/edit`)
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
                className="mx-auto w-full max-w-2xl"
                header={{
                    bordered: true,
                    className: 'card-header-extra',
                    content: (
                        <button
                            type="button"
                            className="inline-flex shrink-0 items-center gap-3 text-gray-800 outline-hidden transition-colors hover:text-primary dark:text-gray-100 dark:hover:text-primary"
                            onClick={() => navigate(kind.basePath)}
                        >
                            <span className="rounded-full bg-gray-100 p-2 text-xl transition-colors hover:bg-primary/10 dark:bg-gray-700 dark:hover:bg-primary/20">
                                <TbArrowNarrowLeft />
                            </span>
                            <span className="text-sm font-semibold">Назад</span>
                        </button>
                    ),
                }}
            >
                <div className="flex flex-col gap-6 p-2">
                    <div>
                        <h3 className="mb-2">{kind.createLabel}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Укажите название {kind.itemNameGenitive}. После создания откроется страница для редактирования.
                        </p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            void handleCreate()
                        }}
                        className="flex flex-col gap-4"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Название {kind.itemNameGenitive}
                            </label>
                            <Input
                                autoFocus
                                value={title}
                                placeholder={`Введите название ${kind.itemNameGenitive}`}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="default"
                                onClick={() => navigate(kind.basePath)}
                                disabled={isSaving}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                loading={isSaving}
                                disabled={isSaving || !title.trim()}
                            >
                                Создать
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    )
}

export default CreateArticle
