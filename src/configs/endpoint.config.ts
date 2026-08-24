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
    realtyPropertiesFilters: '/v2/realty_properties/filters',
    realtyProjects: '/v2/realty_projects',
    realtyProperty: (propertyId: string | number) =>
        `/v2/realty_properties/${propertyId}`,
    realtyObject: (objectId: string | number) =>
        `/v2/realty_objects/${objectId}`,
    realtyObjectChess: (complexId: string | number) =>
        `/v2/realty_objects/${complexId}/chess`,
    fixations: '/v2/fixations',
    fixation: (fixationId: string | number) => `/v2/fixations/${fixationId}`,
    fixationRelatedClients: (fixationId: string | number) =>
        `/v2/fixations/${fixationId}/related_clients`,
    clients: '/v2/clients',
    managers: '/v2/managers',
    realtyCollectionDefault: '/v2/realty_collections/default',
    realtyCollectionProperties: (collectionId: string | number) =>
        `/v2/realty_collections/${collectionId}/properties`,
    realtyCollectionDefaultProperties:
        '/v2/realty_collections/default/properties',
    realtyCollectionCheckProperties: (collectionId: string | number) =>
        `/v2/realty_collections/${collectionId}/check_properties`,
    pushSubscribe: '/v2/push/subscribe',
    pushUnsubscribe: '/v2/push/unsubscribe',
    news: '/v2/news',
    newsArticles: '/v2/news/articles',
    newsEvents: '/v2/news/events',
    newsItem: (newsId: string | number) => `/v2/news/${newsId}`,
}

export default endpointConfig
