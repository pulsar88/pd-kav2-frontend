import Container from '@/components/shared/Container'
import ProfileForm from './components/ProfileForm'
import ChangePassword from './components/ChangePassword'
import NotificationPreferences from './components/NotificationPreferences'
import PrimaryColor from './components/PrimaryColor'

const Profile = () => {
    return (
        <Container>
            <div className="mb-6">
                <h3 className="mb-1">Профиль</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Управляйте личными данными, уведомлениями и безопасностью
                    аккаунта
                </p>
            </div>
            <div className="flex flex-col gap-6">
                <ProfileForm />
                <PrimaryColor />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                    <div className="xl:col-span-8">
                        <ChangePassword />
                    </div>
                    <div className="xl:col-span-4">
                        <NotificationPreferences />
                    </div>
                </div>
            </div>
        </Container>
    )
}

export default Profile
