import Container from '@/components/shared/Container'
import ProfileForm from './components/ProfileForm'
import ChangePassword from './components/ChangePassword'
import NotificationPreferences from './components/NotificationPreferences'
import PwaInstallCard from './components/PwaInstallCard'
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
                <ChangePassword />
                <NotificationPreferences />
                <PwaInstallCard />
                <PrimaryColor />
            </div>
        </Container>
    )
}

export default Profile
