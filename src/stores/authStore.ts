import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState } from '@/types'

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        // Simple admin login for demo - replace with real auth later
        if (email === 'admin' && password === 'admin') {
          const user: User = {
            id: '1',
            email: 'admin@tfgrecruit.com',
            role: 'admin',
            created_at: new Date().toISOString()
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
          
          return true
        }
        
        set({ isLoading: false })
        return false
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false
        })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)