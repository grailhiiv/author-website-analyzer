export type AppSession = {
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
        authority: string[]
    }
} | null
