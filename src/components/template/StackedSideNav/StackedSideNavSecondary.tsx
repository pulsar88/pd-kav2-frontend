import ScrollBar from '@/components/ui/ScrollBar'
import classNames from '@/utils/classNames'
import { HEADER_HEIGHT, DIR_LTR, DIR_RTL } from '@/constants/theme.constant'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import { HiOutlineArrowSmLeft, HiOutlineArrowSmRight } from 'react-icons/hi'
import type { NavigationTree } from '@/@types/navigation'
import type { Direction } from '@/@types/theme'

type StackedSideNavSecondaryProps = {
    className?: string
    title: string
    menu?: NavigationTree[]
    routeKey: string
    onCollapse: () => void
    direction?: Direction
    userAuthority: string[]
}

const StackedSideNavSecondary = (props: StackedSideNavSecondaryProps) => {
    const {
        className,
        title,
        menu,
        routeKey,
        onCollapse,
        direction,
        userAuthority,
        ...rest
    } = props

    const handleCollpase = () => {
        onCollapse()
    }

    return (
        <div className={classNames('h-full', className)} {...rest}>
            <div
                className={`flex items-center justify-between gap-4 pl-6 pr-4`}
                style={{ height: HEADER_HEIGHT }}
            >
                <h5 className="font-bold">{title}</h5>
                <button
                    type="button"
                    className="close-button"
                    onClick={handleCollpase}
                >
                    {direction === DIR_LTR && <HiOutlineArrowSmLeft />}
                    {direction === DIR_RTL && <HiOutlineArrowSmRight />}
                </button>
            </div>
            <ScrollBar
                autoHide
                className="h-[calc(100%-64px)]"
                direction={direction}
            >
                <VerticalMenuContent
                    routeKey={routeKey}
                    navigationTree={menu}
                    userAuthority={userAuthority}
                />
            </ScrollBar>
        </div>
    )
}

export default StackedSideNavSecondary
