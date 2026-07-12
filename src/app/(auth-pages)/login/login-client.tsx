'use client'

import SignIn from '@/components/auth/SignIn'
import type { OnOauthSignInPayload, OnSignInPayload } from '@/components/auth/SignIn'

import { signInAdminAction } from './actions'

export default function LoginClient() {
    const handleSignIn = async ({
        values,
        setSubmitting,
        setMessage,
    }: OnSignInPayload) => {
        setSubmitting(true)

        const formData = new FormData()
        formData.set('email', values.email)
        formData.set('password', values.password)

        const result = await signInAdminAction({}, formData)

        if (result?.error) {
            setMessage(result.error)
            setSubmitting(false)
        }
    }

    const handleOauthSignIn = ({ setMessage }: OnOauthSignInPayload) => {
        setMessage?.('Use the administrator email and password configured for this app.')
    }

    return (
        <SignIn
            showAdditionalOptions={false}
            onSignIn={handleSignIn}
            onOauthSignIn={handleOauthSignIn}
        />
    )
}
