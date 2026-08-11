export const categoriesData = [
    {
        name: 'Начало работы',
        topics: [
            {
                id: 'introduction',
                name: 'Введение',
                description: 'Обзор кабинета агента и основных возможностей.',
                articleCounts: 2,
            },
            {
                id: 'account',
                name: 'Аккаунт',
                description: 'Вход, регистрация и настройки профиля.',
                articleCounts: 2,
            },
            {
                id: 'navigation',
                name: 'Навигация',
                description: 'Как ориентироваться в разделах кабинета.',
                articleCounts: 1,
            },
        ],
    },
    {
        name: 'Работа с объектами',
        topics: [
            {
                id: 'objects',
                name: 'Объекты',
                description: 'Поиск ЖК, помещений и работа с каталогом.',
                articleCounts: 2,
            },
            {
                id: 'checkboard',
                name: 'Шахматка',
                description: 'Как пользоваться шахматкой и статусами.',
                articleCounts: 2,
            },
            {
                id: 'fixations',
                name: 'Фиксации',
                description: 'Создание и ведение заявок на фиксацию.',
                articleCounts: 3,
            },
        ],
    },
]

const author = {
    name: 'Служба поддержки',
    img: '',
}

export const articleListData = [
    {
        id: '1',
        title: 'Что такое кабинет агента',
        content:
            'Краткий обзор назначения кабинета агента и основных сценариев работы.',
        category: 'introduction',
        authors: [author],
        tags: [
            { id: '1', label: 'Обзор' },
            { id: '2', label: 'Старт' },
        ],
        starred: true,
        published: true,
        updateTime: '3 дня назад',
        createdBy: 'Служба поддержки',
        timeToRead: 3,
        viewCount: 128,
        commentCount: 4,
    },
    {
        id: '2',
        title: 'Первые шаги после входа',
        content:
            'Что сделать сразу после авторизации: профиль, объекты и фиксации.',
        category: 'introduction',
        authors: [author],
        tags: [{ id: '2', label: 'Старт' }],
        starred: true,
        published: true,
        updateTime: 'неделю назад',
        createdBy: 'Служба поддержки',
        timeToRead: 4,
        viewCount: 96,
        commentCount: 2,
    },
    {
        id: '3',
        title: 'Вход по паролю и SMS-коду',
        content:
            'Как войти в кабинет с номером телефона, паролем или одноразовым кодом.',
        category: 'account',
        authors: [author],
        tags: [{ id: '3', label: 'Авторизация' }],
        starred: true,
        published: true,
        updateTime: '2 дня назад',
        createdBy: 'Служба поддержки',
        timeToRead: 3,
        viewCount: 210,
        commentCount: 7,
    },
    {
        id: '4',
        title: 'Редактирование профиля',
        content: 'Как обновить личные данные и сменить пароль.',
        category: 'account',
        authors: [author],
        tags: [{ id: '4', label: 'Профиль' }],
        starred: false,
        published: true,
        updateTime: 'месяц назад',
        createdBy: 'Служба поддержки',
        timeToRead: 2,
        viewCount: 54,
        commentCount: 1,
    },
    {
        id: '5',
        title: 'Разделы бокового меню',
        content: 'Описание пунктов меню: объекты, фиксации, профиль и помощь.',
        category: 'navigation',
        authors: [author],
        tags: [{ id: '5', label: 'Интерфейс' }],
        starred: false,
        published: true,
        updateTime: '2 недели назад',
        createdBy: 'Служба поддержки',
        timeToRead: 2,
        viewCount: 41,
        commentCount: 0,
    },
    {
        id: '6',
        title: 'Поиск жилых комплексов',
        content: 'Фильтры и параметры поиска объектов в каталоге.',
        category: 'objects',
        authors: [author],
        tags: [{ id: '6', label: 'Объекты' }],
        starred: true,
        published: true,
        updateTime: '5 дней назад',
        createdBy: 'Служба поддержки',
        timeToRead: 5,
        viewCount: 173,
        commentCount: 5,
    },
    {
        id: '7',
        title: 'Карточка помещения',
        content: 'Что отображается в карточке квартиры и как открыть галерею.',
        category: 'objects',
        authors: [author],
        tags: [{ id: '6', label: 'Объекты' }],
        starred: false,
        published: true,
        updateTime: 'неделю назад',
        createdBy: 'Служба поддержки',
        timeToRead: 3,
        viewCount: 88,
        commentCount: 3,
    },
    {
        id: '8',
        title: 'Классическая шахматка',
        content: 'Как читать статусы и выбирать квартиры на классической шахматке.',
        category: 'checkboard',
        authors: [author],
        tags: [{ id: '7', label: 'Шахматка' }],
        starred: true,
        published: true,
        updateTime: '4 дня назад',
        createdBy: 'Служба поддержки',
        timeToRead: 4,
        viewCount: 142,
        commentCount: 6,
    },
    {
        id: '9',
        title: 'Шахматка Plus',
        content: 'Особенности расширенной шахматки и быстрый выбор лотов.',
        category: 'checkboard',
        authors: [author],
        tags: [{ id: '7', label: 'Шахматка' }],
        starred: false,
        published: true,
        updateTime: '10 дней назад',
        createdBy: 'Служба поддержки',
        timeToRead: 4,
        viewCount: 67,
        commentCount: 2,
    },
    {
        id: '10',
        title: 'Создание фиксации',
        content: 'Пошаговый мастер создания заявки на фиксацию клиента.',
        category: 'fixations',
        authors: [author],
        tags: [{ id: '8', label: 'Фиксации' }],
        starred: true,
        published: true,
        updateTime: 'вчера',
        createdBy: 'Служба поддержки',
        timeToRead: 6,
        viewCount: 256,
        commentCount: 12,
    },
    {
        id: '11',
        title: 'Родственники клиента',
        content: 'Как добавить родственников и указать степень родства.',
        category: 'fixations',
        authors: [author],
        tags: [{ id: '8', label: 'Фиксации' }],
        starred: false,
        published: true,
        updateTime: '3 дня назад',
        createdBy: 'Служба поддержки',
        timeToRead: 3,
        viewCount: 79,
        commentCount: 4,
    },
    {
        id: '12',
        title: 'Статусы и продление фиксации',
        content: 'Какие бывают статусы и как запросить продление.',
        category: 'fixations',
        authors: [author],
        tags: [{ id: '8', label: 'Фиксации' }],
        starred: false,
        published: true,
        updateTime: 'неделю назад',
        createdBy: 'Служба поддержки',
        timeToRead: 3,
        viewCount: 101,
        commentCount: 3,
    },
]

export const articleDetailsById: Record<
    string,
    {
        content: string
        tableOfContent: { id: string; label: string }[]
    }
> = {
    '1': {
        content: `
            <p>Кабинет агента — рабочее пространство для подбора объектов, фиксации клиентов и сопровождения сделок.</p>
            <div id="purpose">
                <h5>Зачем нужен кабинет</h5>
                <p>Система помогает быстро находить подходящие помещения, фиксировать интерес клиента и отслеживать статусы заявок в одном месте.</p>
            </div>
            <div id="main-sections">
                <h5>Основные разделы</h5>
                <p>В меню доступны объекты и шахматка, фиксации, профиль агента и центр помощи со статьями по всем сценариям.</p>
            </div>
            <div id="next-steps">
                <h5>С чего начать</h5>
                <p>Заполните профиль, изучите каталог объектов и создайте первую фиксацию через мастер.</p>
            </div>
        `,
        tableOfContent: [
            { id: 'purpose', label: 'Зачем нужен кабинет' },
            { id: 'main-sections', label: 'Основные разделы' },
            { id: 'next-steps', label: 'С чего начать' },
        ],
    },
    '2': {
        content: `
            <p>После входа откройте профиль и проверьте контактные данные — это ускорит создание фиксаций.</p>
            <div id="profile-check">
                <h5>Проверьте профиль</h5>
                <p>Убедитесь, что указаны актуальные ФИО, телефон и агентство.</p>
            </div>
            <div id="explore-objects">
                <h5>Изучите объекты</h5>
                <p>Перейдите в раздел «Объекты», выберите ЖК и откройте шахматку для просмотра доступных лотов.</p>
            </div>
        `,
        tableOfContent: [
            { id: 'profile-check', label: 'Проверьте профиль' },
            { id: 'explore-objects', label: 'Изучите объекты' },
        ],
    },
    '3': {
        content: `
            <p>Авторизация выполняется по номеру телефона. Для зарегистрированных пользователей доступны пароль и вход по SMS-коду.</p>
            <div id="password-login">
                <h5>Вход по паролю</h5>
                <p>Введите номер, подтвердите согласия и укажите пароль. Минимальная длина пароля — 6 символов без пробелов.</p>
            </div>
            <div id="otp-login">
                <h5>Вход по коду</h5>
                <p>Выберите «Войти по коду из SMS», введите 4 цифры из сообщения. Повторная отправка доступна через 1 минуту.</p>
            </div>
            <div id="registration">
                <h5>Регистрация</h5>
                <p>Если номер новый, система предложит создать пароль и подтвердить его кодом из SMS.</p>
            </div>
        `,
        tableOfContent: [
            { id: 'password-login', label: 'Вход по паролю' },
            { id: 'otp-login', label: 'Вход по коду' },
            { id: 'registration', label: 'Регистрация' },
        ],
    },
    '4': {
        content: `
            <p>В профиле можно изменить персональные данные и пароль.</p>
            <div id="personal-data">
                <h5>Личные данные</h5>
                <p>Обновите ФИО и контакты, затем сохраните изменения.</p>
            </div>
            <div id="password-change">
                <h5>Смена пароля</h5>
                <p>Укажите текущий и новый пароль. После успешного обновления появится уведомление.</p>
            </div>
        `,
        tableOfContent: [
            { id: 'personal-data', label: 'Личные данные' },
            { id: 'password-change', label: 'Смена пароля' },
        ],
    },
    '5': {
        content: `
            <p>Боковое меню даёт быстрый доступ ко всем ключевым разделам кабинета.</p>
            <div id="menu-items">
                <h5>Пункты меню</h5>
                <p>Доступны: главная, фиксации, объекты, профиль и помощь.</p>
            </div>
        `,
        tableOfContent: [{ id: 'menu-items', label: 'Пункты меню' }],
    },
    '6': {
        content: `
            <p>В каталоге можно искать ЖК по параметрам и быстро переходить к шахматке.</p>
            <div id="filters">
                <h5>Фильтры</h5>
                <p>Используйте фильтры по городу, застройщику, цене и площади, чтобы сузить выдачу.</p>
            </div>
            <div id="results">
                <h5>Результаты</h5>
                <p>Карточки комплексов показывают ключевые характеристики и ведут к подробной шахматке.</p>
            </div>
        `,
        tableOfContent: [
            { id: 'filters', label: 'Фильтры' },
            { id: 'results', label: 'Результаты' },
        ],
    },
    '7': {
        content: `
            <p>Карточка помещения содержит планировку, цену, статусы и фотогалерею.</p>
            <div id="gallery">
                <h5>Галерея</h5>
                <p>Откройте изображения в полноэкранном просмотре для детального изучения объекта.</p>
            </div>
        `,
        tableOfContent: [{ id: 'gallery', label: 'Галерея' }],
    },
    '8': {
        content: `
            <p>Классическая шахматка показывает этажи и квартиры в виде сетки со статусами.</p>
            <div id="statuses">
                <h5>Статусы</h5>
                <p>Цветовая маркировка помогает отличить свободные, забронированные и проданные лоты.</p>
            </div>
            <div id="selection">
                <h5>Выбор квартиры</h5>
                <p>Клик по ячейке открывает карточку помещения с деталями.</p>
            </div>
        `,
        tableOfContent: [
            { id: 'statuses', label: 'Статусы' },
            { id: 'selection', label: 'Выбор квартиры' },
        ],
    },
    '9': {
        content: `
            <p>Шахматка Plus добавляет расширенные подсказки и удобную навигацию по корпусам.</p>
            <div id="plus-features">
                <h5>Возможности Plus</h5>
                <p>Используйте подсветку выбранных лотов и быстрые фильтры по комнатности.</p>
            </div>
        `,
        tableOfContent: [{ id: 'plus-features', label: 'Возможности Plus' }],
    },
    '10': {
        content: `
            <p>Мастер создания фиксации проводит через выбор клиента, объектов и предпочтений.</p>
            <div id="wizard-steps">
                <h5>Шаги мастера</h5>
                <p>Заполните данные клиента, добавьте родственников при необходимости, выберите объекты и подтвердите заявку.</p>
            </div>
            <div id="tips">
                <h5>Советы</h5>
                <p>Проверяйте корректность телефона и согласий — это снижает риск отклонения заявки.</p>
            </div>
        `,
        tableOfContent: [
            { id: 'wizard-steps', label: 'Шаги мастера' },
            { id: 'tips', label: 'Советы' },
        ],
    },
    '11': {
        content: `
            <p>К фиксации можно добавить родственников клиента с указанием степени родства.</p>
            <div id="add-relative">
                <h5>Добавление</h5>
                <p>Найдите клиента через поиск, выберите степень родства и сохраните запись.</p>
            </div>
        `,
        tableOfContent: [{ id: 'add-relative', label: 'Добавление' }],
    },
    '12': {
        content: `
            <p>Статусы показывают этап обработки фиксации. При необходимости можно запросить продление.</p>
            <div id="status-list">
                <h5>Статусы</h5>
                <p>Отслеживайте активные, ожидающие и завершённые заявки в списке фиксаций.</p>
            </div>
            <div id="extend">
                <h5>Продление</h5>
                <p>Из карточки фиксации отправьте заявку на продление на нужное количество дней.</p>
            </div>
        `,
        tableOfContent: [
            { id: 'status-list', label: 'Статусы' },
            { id: 'extend', label: 'Продление' },
        ],
    },
}

export const getArticleDetail = (id: string) => {
    return articleDetailsById[id] || articleDetailsById['1']
}
