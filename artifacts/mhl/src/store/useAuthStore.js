import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      try {
        await get().fetchProfile(session.user)
      } catch {
        set({ user: session.user, profile: null })
      }
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          await get().fetchProfile(session.user)
        } catch {
          set({ user: session.user, profile: null })
        }
      } else {
        set({ user: null, profile: null, loading: false })
      }
    })
  },

  fetchProfile: async (user) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    set({ user, profile: data })
    if (error) console.warn('fetchProfile error:', error.message)
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data?.user) {
      await get().fetchProfile(data.user)
    }
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  isAdmin: () => get().profile?.role === 'admin',
}))
