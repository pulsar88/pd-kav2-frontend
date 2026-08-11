import Lightbox, { LightboxProps } from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import type { ReactNode } from 'react'

export type ImageGalleryProps = Partial<LightboxProps> & {
    children?: ReactNode
    index?: number
    onClose?: () => void
}

const ImageGallery = ({
    children,
    index = -1,
    slides,
    onClose,
    carousel,
    controller,
    render,
    ...rest
}: ImageGalleryProps) => {
    const isSingleSlide = (slides?.length ?? 0) <= 1

    return (
        <>
            {children}
            <Lightbox
                index={index}
                slides={slides}
                {...rest}
                open={index >= 0}
                close={() => onClose?.()}
                carousel={{
                    ...carousel,
                    finite: isSingleSlide || carousel?.finite,
                }}
                controller={{
                    closeOnBackdropClick: true,
                    ...controller,
                    disableSwipeNavigation:
                        isSingleSlide ||
                        Boolean(controller?.disableSwipeNavigation),
                }}
                render={{
                    ...render,
                    buttonPrev: isSingleSlide
                        ? () => null
                        : render?.buttonPrev,
                    buttonNext: isSingleSlide
                        ? () => null
                        : render?.buttonNext,
                }}
            />
        </>
    )
}

export default ImageGallery
