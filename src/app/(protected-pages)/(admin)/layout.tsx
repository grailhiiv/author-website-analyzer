import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { getAdminRouteAccess } from '@/lib/admin/access'
import { getAllowedAdminEmail } from '@/lib/auth/admin'
import { auth } from '@/lib/auth/server'

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    const access = getAdminRouteAccess({
        allowedAdminEmail: getAllowedAdminEmail(),
        userEmail: session?.user.email,
    })

    if (!session || !access.allowed) {
        redirect(access.redirectTo ?? '/login')
    }

    return children
}
