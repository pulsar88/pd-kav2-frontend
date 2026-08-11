import type { ReactNode } from 'react'
import {
    TbPresentation,
    TbUser,
    TbLayoutNavbar,
    TbBuilding,
    TbLayoutGrid,
    TbClipboardList,
} from 'react-icons/tb'

export const categoryIcon: Record<string, ReactNode> = {
    introduction: <TbPresentation />,
    account: <TbUser />,
    navigation: <TbLayoutNavbar />,
    objects: <TbBuilding />,
    checkboard: <TbLayoutGrid />,
    fixations: <TbClipboardList />,
}

export const categoryLabel: Record<string, string> = {
    introduction: 'Введение',
    account: 'Аккаунт',
    navigation: 'Навигация',
    objects: 'Объекты',
    checkboard: 'Шахматка',
    fixations: 'Фиксации',
}
