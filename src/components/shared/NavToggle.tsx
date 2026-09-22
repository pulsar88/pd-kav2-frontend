import { IoIosArrowForward, IoIosArrowBack } from 'react-icons/io'
import type { CommonProps } from '@/@types/common'

export interface NavToggleProps extends CommonProps {
    /** Меню раскрыто (false — закрыто или свёрнуто). */
    toggled?: boolean
}

const NavToggle = ({ toggled, className }: NavToggleProps) => {
    return (
        <div className={className}>
            {toggled ? <IoIosArrowBack /> : <IoIosArrowForward />}
        </div>
    )
}

export default NavToggle
