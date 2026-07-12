import Container from './LandingContainer'
import Button from '@/components/ui/Button'
import AuroraBackground from './AuroraBackground'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Mode } from '@/@types/theme'

const LandingFooter = ({ mode }: { mode: Mode }) => {
    const year = new Date().getFullYear()

    const router = useRouter()

    const handlePreview = () => {
        router.push('/dashboards/ecommerce')
    }

    return (
        <div id="footer" className="relative z-20">
            <Container className="relative">
                <div className="py-10 md:py-40">
                    <AuroraBackground
                        className="rounded-3xl"
                        auroraClassName="rounded-3xl"
                    >
                        <motion.div
                            initial={{ opacity: 0.0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.3,
                                duration: 0.3,
                                ease: 'easeInOut',
                            }}
                            className="relative flex flex-col gap-4 items-center justify-center py-20 px-8 text-center"
                        >
                            <h2 className="text-5xl">Ready to Get Started?</h2>
                            <p className="mt-4 max-w-[400px] mx-auto">
                                Build modern, scalable applications effortlessly
                                with Ecme. Take your project to the next level
                                today!
                            </p>
                            <div className="mt-6">
                                <Button variant="solid" onClick={handlePreview}>
                                    Get Started Now
                                </Button>
                            </div>
                        </motion.div>
                    </AuroraBackground>
                </div>
                <div className="py-6 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
                        <Link href="/">
                            <Image
                                className="size-[46px]"
                                src={
                                    mode === 'light'
                                        ? '/grailhiiv-logo-dark.svg'
                                        : '/grailhiiv-logo-light.svg'
                                }
                                width={46}
                                height={46}
                                alt="Author Websites logo"
                            />
                        </Link>
                        <p className="text-center">
                            Copyright © {year} Theme_Nate. All rights reserved.
                        </p>
                    </div>
                </div>
            </Container>
        </div>
    )
}

export default LandingFooter
