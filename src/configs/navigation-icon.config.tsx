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
    PiShieldCheckDuotone,
    PiCalculatorDuotone,
    PiScalesDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'
import { TbUserCheck } from 'react-icons/tb'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <PiHouseLineDuotone />,
    fixations: <PiClipboardTextDuotone />,
    objects: <PiBuildingsDuotone />,
    favoritePremises: <PiHeartDuotone />,
    comparisonPremises: <PiScalesDuotone />,
    profile: <PiUserDuotone />,
    tools: <PiWrenchDuotone />,
    calculator: <PiCalculatorDuotone />,
    help: <PiQuestionDuotone />,
    news: <PiNewspaperDuotone />,
    events: <PiCalendarDuotone />,
    agencyRequests: <TbUserCheck />,
    supervisor: <PiShieldCheckDuotone />,
}

export default navigationIcon
