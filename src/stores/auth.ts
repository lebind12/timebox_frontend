import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.id)

  function setSession(newSession: Session | null) {
    session.value = newSession
    user.value = newSession?.user ?? null
    loading.value = false
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    setSession(data.session)
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
  }

  async function initialize() {
    loading.value = true
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    setSession(currentSession)

    supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    userId,
    setSession,
    signUp,
    signIn,
    signOut,
    initialize,
  }
})
