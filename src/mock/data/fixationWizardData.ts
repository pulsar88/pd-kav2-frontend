import type {
    FixationClient,
    FixationComplex,
} from '@/views/fixations/createWizard.types'

export const fixationClientsData: FixationClient[] = [
    {
        id: 'c1',
        fullName: 'Петров Алексей Сергеевич',
        phone: '+7 999 111 22 33',
    },
    {
        id: 'c2',
        fullName: 'Сидорова Мария Ивановна',
        phone: '+7 916 555 44 33',
    },
    {
        id: 'c3',
        fullName: 'Козлов Дмитрий Андреевич',
        phone: '+7 903 222 11 00',
    },
    {
        id: 'c4',
        fullName: 'Новикова Анна Петровна',
        phone: '+7 926 100 20 30',
    },
    {
        id: 'c5',
        fullName: 'Морозов Игорь Владимирович',
        phone: '+7 925 200 30 40',
    },
    {
        id: 'c6',
        fullName: 'Волкова Елена Сергеевна',
        phone: '+7 903 300 40 50',
    },
    {
        id: 'c7',
        fullName: 'Соколов Павел Николаевич',
        phone: '+7 917 400 50 60',
    },
    {
        id: 'c8',
        fullName: 'Лебедева Ольга Игоревна',
        phone: '+7 909 500 60 70',
    },
    {
        id: 'c9',
        fullName: 'Кузнецов Артём Дмитриевич',
        phone: '+7 915 600 70 80',
    },
    {
        id: 'c10',
        fullName: 'Попова Наталья Алексеевна',
        phone: '+7 919 700 80 90',
    },
    {
        id: 'c11',
        fullName: 'Васильев Сергей Петрович',
        phone: '+7 929 111 22 01',
    },
    {
        id: 'c12',
        fullName: 'Зайцева Ирина Михайловна',
        phone: '+7 929 111 22 02',
    },
    {
        id: 'c13',
        fullName: 'Павлов Максим Олегович',
        phone: '+7 929 111 22 03',
    },
    {
        id: 'c14',
        fullName: 'Семёнова Дарья Андреевна',
        phone: '+7 929 111 22 04',
    },
    {
        id: 'c15',
        fullName: 'Голубев Никита Сергеевич',
        phone: '+7 929 111 22 05',
    },
    {
        id: 'c16',
        fullName: 'Виноградова Юлия Романовна',
        phone: '+7 929 111 22 06',
    },
    {
        id: 'c17',
        fullName: 'Борисов Кирилл Иванович',
        phone: '+7 929 111 22 07',
    },
    {
        id: 'c18',
        fullName: 'Фёдорова Алина Павловна',
        phone: '+7 929 111 22 08',
    },
    {
        id: 'c19',
        fullName: 'Михайлов Денис Алексеевич',
        phone: '+7 929 111 22 09',
    },
    {
        id: 'c20',
        fullName: 'Алексеева Виктория Олеговна',
        phone: '+7 929 111 22 10',
    },
    {
        id: 'c21',
        fullName: 'Николаев Роман Владимирович',
        phone: '+7 929 111 22 11',
    },
    {
        id: 'c22',
        fullName: 'Егорова Ксения Дмитриевна',
        phone: '+7 929 111 22 12',
    },
    {
        id: 'c23',
        fullName: 'Орлов Владислав Сергеевич',
        phone: '+7 929 111 22 13',
    },
    {
        id: 'c24',
        fullName: 'Андреева Татьяна Игоревна',
        phone: '+7 929 111 22 14',
    },
    {
        id: 'c25',
        fullName: 'Макаров Евгений Николаевич',
        phone: '+7 929 111 22 15',
    },
]

export const fixationComplexesData: FixationComplex[] = [
    {
        id: 'jk1',
        name: 'Дом Колотушкина',
        address: 'ул. Колотушкина, 2',
        apartments: [
            { id: 'a1', number: '12', rooms: 1 },
            { id: 'a2', number: '45', rooms: 2 },
            { id: 'a3', number: '108', rooms: 3 },
            { id: 'a77', number: '77', rooms: 1 },
        ],
        managers: [
            { id: 'm1', fullName: 'Иванова Елена', phone: '+7 900 111 22 33' },
            { id: 'm2', fullName: 'Смирнов Павел', phone: '+7 900 111 22 44' },
        ],
    },
    {
        id: 'jk2',
        name: 'ЖК «Речной»',
        address: 'наб. Речная, 5',
        apartments: [
            { id: 'a4', number: '3', rooms: 2 },
            { id: 'a5', number: '77', rooms: 1 },
        ],
        managers: [
            {
                id: 'm3',
                fullName: 'Кузнецова Ольга',
                phone: '+7 900 222 33 44',
                photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
            },
            { id: 'm4', fullName: 'Орлов Никита', phone: '+7 900 222 33 55' },
        ],
    },
    {
        id: 'jk3',
        name: 'ЖК «Парк»',
        address: 'пр. Парковый, 21',
        apartments: [],
        managers: [{ id: 'm5', fullName: 'Васильев Артём', phone: '+7 900 333 44 55' }],
    },
]
