import { create } from 'zustand'

type SessionState = {
  token: string | null
  userEmail: string | null
  setToken: (token: string | null) => void
  clear: () => void
  loadFromStorage: () => void
}

function decodeJwtEmail(token: string | null): string | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload?.sub ?? null
  } catch {
    return null
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  userEmail: null,
  setToken: (token) => set(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
    return { token, userEmail: decodeJwtEmail(token) }
  }),
  clear: () => set(() => {
    localStorage.removeItem('token')
    return { token: null, userEmail: null }
  }),
  loadFromStorage: () => set(() => {
    const token = localStorage.getItem('token')
    return { token, userEmail: decodeJwtEmail(token) }
  }),
}))


