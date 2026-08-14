import type { Complex } from '@/views/objects/types'

/** Положите файл сюда: public/img/layouts/plan.png */
export const DEFAULT_LAYOUT_IMAGE = '/img/layouts/plan.png'

/** Дефолтное изображение дома, если API не вернул картинку */
export const DEFAULT_COMPLEX_IMAGE =
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'

export const complexesData: Complex[] = [
    {
        id: 'jk1',
        name: 'Дом Колотушкина',
        address: 'ул. Колотушкина, 2',
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        apartmentsCount: 248,
        priceFrom: 6_200_000,
        pricePerSqm: 168_000,
        completionDate: '2026-06-01',
        houseType: 'monolith',
        houseStatus: 'under_construction',
        floors: 18,
        finishing: 'fine',
    },
]

/** Помещения каталога формируются из данных шахматки — см. catalogUtils */
