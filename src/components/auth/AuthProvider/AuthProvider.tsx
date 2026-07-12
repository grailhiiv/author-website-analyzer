'use client'

import SessionContext from './SessionContext'
import type { AppSession } from './session'

type AuthProviderProps = {
    session: AppSession
    children: React.ReactNode
}

const AuthProvider = (props: AuthProviderProps) => {
    const { session, children } = props

    return (
        <SessionContext.Provider value={session}>
            {children}
        </SessionContext.Provider>
    )
}

export default AuthProvider
