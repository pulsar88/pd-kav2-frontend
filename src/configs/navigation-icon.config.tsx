import {
    PiHouseLineDuotone,
    PiUserDuotone,
    PiClipboardTextDuotone,
    PiBuildingsDuotone,
    PiQuestionDuotone,
    PiWrenchDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <PiHouseLineDuotone />,
    fixations: <PiClipboardTextDuotone />,
    objects: <PiBuildingsDuotone />,
    profile: <PiUserDuotone />,
    tools: <PiWrenchDuotone />,
    help: <PiQuestionDuotone />,
}

export default navigationIcon
