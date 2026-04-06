import { create } from 'zustand'
import { apiClient } from '@/api/client'

const TOKEN_KEY = 'declaro-auth-token'

interface AuthUser {
  id: number
  email: string
}

interface AuthStore {
  token: string | null
  user: AuthUser | null
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  init: () => Promise<void>
}

async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ id: number; email: string; is_active: boolean }>('/auth/me')
  return { id: data.id, email: data.email }
}

export const useAuth = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  initialized: false,

  init: async () => {
    if (get().initialized) return
    let token: string | null = null
    try {
      token = localStorage.getItem(TOKEN_KEY)
    } catch {
      token = null
    }

    if (!token) {
      set({ initialized: true })
      return
    }

    set({ token })
    try {
      const user = await fetchMe()
      set({ user, initialized: true })
    } catch {
      try {
        localStorage.removeItem(TOKEN_KEY)
      } catch {
        // ignore
      }
      set({ token: null, user: null, initialized: true })
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<{ access_token: string; token_type: string }>(
      '/auth/login',
      { email, password }
    )
    const token = data.access_token
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // ignore storage errors
    }
    set({ token })
    const user = await fetchMe()
    set({ user })
  },

  register: async (email: string, password: string) => {
    const { data } = await apiClient.post<{ access_token: string; token_type: string }>(
      '/auth/register',
      { email, password }
    )
    const token = data.access_token
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // ignore storage errors
    }
    set({ token })
    const user = await fetchMe()
    set({ user })
  },

  logout: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // ignore storage errors
    }
    set({ token: null, user: null })
    window.location.href = '/login'
  },
}))
