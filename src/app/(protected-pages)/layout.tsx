import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

import AuthProvider from '@/components/auth/AuthProvider'
import PostLoginLayout from '@/components/layouts/PostLoginLayout'
import { isAllowedAdminEmail } from '@/lib/auth/admin'
import { auth } from '@/lib/auth/server'
import { ReactNode } from 'react'

const Layout = async ({ children }: { children: ReactNode }) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session || !isAllowedAdminEmail(session.user.email)) {
        redirect('/login')
    }

    const appSession = {
        user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? null,
            authority: ['admin'],
        },
    }

    return (
        <AuthProvider session={appSession}>
            <PostLoginLayout>{children}</PostLoginLayout>
        </AuthProvider>
    )
}

export default Layout
