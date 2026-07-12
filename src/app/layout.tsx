import type { ReactNode } from 'react'
import { getLocale, getMessages } from 'next-intl/server'

import LocaleProvider from '@/components/template/LocaleProvider'
import NavigationProvider from '@/components/template/Navigation/NavigationProvider'
import ThemeProvider from '@/components/template/Theme/ThemeProvider'
import { getNavigation } from '@/server/actions/navigation/getNavigation'
import { getTheme } from '@/server/actions/theme'
import '@/assets/styles/app.css'

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
            className={theme.mode === 'dark' ? 'dark' : 'light'}
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
