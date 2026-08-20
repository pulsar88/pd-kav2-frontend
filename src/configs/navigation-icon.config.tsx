import {
    PiHouseLineDuotone,
    PiUserDuotone,
    PiClipboardTextDuotone,
    PiBuildingsDuotone,
    PiQuestionDuotone,
    PiNewspaperDuotone,
    PiCalendarDuotone,
    PiWrenchDuotone,
    PiHeartDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <PiHouseLineDuotone />,
    fixations: <PiClipboardTextDuotone />,
    objects: <PiBuildingsDuotone />,
    favoritePremises: <PiHeartDuotone />,
    profile: <PiUserDuotone />,
    tools: <PiWrenchDuotone />,
    help: <PiQuestionDuotone />,
    news: <PiNewspaperDuotone />,
    events: <PiCalendarDuotone />,
}

export default navigationIcon
