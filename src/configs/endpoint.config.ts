const endpointConfig = {
    authRegisterSendCode: '/v2/auth/register/send_code',
    authLoginSendCode: '/v2/auth/login/send_code',
    authLogin: '/v2/auth/login',
    authLoginByCode: '/v2/auth/login_by_code',
    authRegister: '/v2/auth/register',
    authRegisterAgency: '/v2/auth/register/agency',
    authLogout: '/v2/auth/logout',
    authRegisterCheck: '/v2/auth/register/check',
    authCheck: '/v2/auth/check',
    authForgotPassword: '/v2/auth/forgot_password',
    authResetPassword: '/v2/auth/reset_password',
    usersCurrent: '/v2/user/current',
    userProfilePicture: '/v2/user/profile_picture',
    usersUpdate: (userId: string | number) => `/v2/users/${userId}`,
    userLogs: '/v2/user/logs',
    userLogsRead: '/v2/user/logs/read',
    logsUnreadCount: '/v2/user/logs/unread-count',
    userNotificationPreferences: '/v2/user/notifications/preferences',
    userNotificationDictionaries: '/v2/user/notifications/dictionaries',
    realtyProperties: '/v2/realty_properties',
    realtyPropertiesSummary: '/v2/realty_properties/summary',
    realtyProjects: '/v2/realty_projects',
    realtyProperty: (propertyId: string | number) =>
        `/v2/realty_properties/${propertyId}`,
    realtyObject: (objectId: string | number) =>
        `/v2/realty_objects/${objectId}`,
    realtyObjectChess: (complexId: string | number) =>
        `/v2/realty_objects/${complexId}/chess`,
}

export default endpointConfig
