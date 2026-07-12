'use client'

import { createContext } from 'react'
import type { AppSession } from './session'

const SessionContext = createContext<AppSession>(null)

export default SessionContext
