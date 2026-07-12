import classNames from 'classnames'
import Image from 'next/image'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number
    logoHeight?: number
}

const Logo = ({
    mode = 'light',
    className,
    imgClass,
    style,
}: LogoProps) => {
    return (
        <div className={classNames('logo', className)} style={style}>
            <Image
                className={classNames('size-[46px]', imgClass)}
                src={
                    mode === 'light'
                        ? '/grailhiiv-logo-dark.svg'
                        : '/grailhiiv-logo-light.svg'
                }
                alt="Author Websites logo"
                width={46}
                height={46}
                priority
            />
        </div>
    )
}

export default Logo
