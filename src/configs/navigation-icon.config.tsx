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
    PiPercentDuotone,
    PiCurrencyCircleDollarDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'
import { TbMailForward, TbUserCheck } from 'react-icons/tb'

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
    agentCommission: <PiCurrencyCircleDollarDuotone />,
    news: <PiNewspaperDuotone />,
    events: <PiCalendarDuotone />,
    offers: <PiPercentDuotone />,
    agencyRequests: <TbUserCheck />,
    agencyInvitations: <TbMailForward />,
    supervisor: <PiShieldCheckDuotone />,
}

export default navigationIcon
