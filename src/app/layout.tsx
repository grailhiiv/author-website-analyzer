import type { ReactNode } from 'react'
import { getLocale, getMessages } from 'next-intl/server'
import localFont from 'next/font/local'

import LocaleProvider from '@/components/template/LocaleProvider'
import NavigationProvider from '@/components/template/Navigation/NavigationProvider'
import ThemeProvider from '@/components/template/Theme/ThemeProvider'
import { getNavigation } from '@/server/actions/navigation/getNavigation'
import { getTheme } from '@/server/actions/theme'
import '@/assets/styles/app.css'

const lazzer = localFont({
    src: './fonts/LazzerVF.woff2',
    weight: '100 900',
    display: 'swap',
    fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
    variable: '--font-lazzer',
})

export const metadata = {
    title: 'Author Website Analyzer | GrailHiiv',
    description:
        'An author-focused website scorecard for brand clarity, book visibility, reader engagement, search visibility, mobile performance, technical health, author trust, and site usability.',
    icons: {
        icon: '/favicon.ico',
    },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
    const [locale, messages, navigationTree, theme] = await Promise.all([
        getLocale(),
        getMessages(),
        getNavigation(),
        getTheme(),
    ])

    return (
        <html
            className={`${lazzer.variable} ${theme.mode === 'dark' ? 'dark' : 'light'}`}
            lang={locale}
            dir={theme.direction}
            suppressHydrationWarning
        >
            <body suppressHydrationWarning>
                <LocaleProvider locale={locale} messages={messages}>
                    <ThemeProvider locale={locale} theme={theme}>
                        <NavigationProvider navigationTree={navigationTree}>
                            {children}
                        </NavigationProvider>
                    </ThemeProvider>
                </LocaleProvider>
            </body>
        </html>
    )
}
