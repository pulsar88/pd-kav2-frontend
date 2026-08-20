import Notification from '@/components/template/Notification'
import UserProfileDropdown from '@/components/template/UserProfileDropdown'

const HeaderEndActions = () => {
    return (
        <>
            <Notification hoverable={false} />
            <UserProfileDropdown hoverable={false} />
        </>
    )
}

export default HeaderEndActions
