import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { isAllowedAdminEmail } from '@/lib/auth/admin'
import { auth } from '@/lib/auth/server'

import LoginClient from './login-client'

export default async function LoginPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (session && isAllowedAdminEmail(session.user.email)) {
        redirect('/dashboard')
    }

    return <LoginClient />
}
