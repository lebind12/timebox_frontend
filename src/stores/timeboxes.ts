import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useUiStore } from './ui'
import type { Timebox, TimeboxInsert, TimeboxUpdate } from '@/types'

export const useTimeboxesStore = defineStore('timeboxes', () => {
  const timeboxes = ref<Timebox[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()
  const uiStore = useUiStore()

  const timeboxesByDate = computed(() => {
    const dateStr = formatDate(uiStore.selectedDate)
    return timeboxes.value.filter((tb) => tb.date === dateStr)
  })

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0] as string
  }

  function timeboxById(id: string) {
    return timeboxes.value.find((tb) => tb.id === id)
  }

  async function fetchTimeboxesByDate(date: Date) {
    if (!authStore.userId) return

    loading.value = true
    error.value = null

    try {
      const dateStr = formatDate(date)
      const { data, error: fetchError } = await supabase
        .from('timeboxes')
        .select('*')
        .eq('user_id', authStore.userId)
        .eq('date', dateStr)
        .order('start_time', { ascending: true })

      if (fetchError) throw fetchError

      // Replace timeboxes for this date
      const otherTimeboxes = timeboxes.value.filter((tb) => tb.date !== dateStr)
      timeboxes.value = [...otherTimeboxes, ...((data as Timebox[]) ?? [])]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch timeboxes'
    } finally {
      loading.value = false
    }
  }

  async function createTimebox(timebox: Omit<TimeboxInsert, 'user_id'>) {
    if (!authStore.userId) return

    loading.value = true
    error.value = null

    try {
      const insertData = { ...timebox, user_id: authStore.userId } as TimeboxInsert
      const { data, error: insertError } = await supabase
        .from('timeboxes')
        .insert(insertData as never)
        .select()
        .single()

      if (insertError) throw insertError
      if (data) {
        timeboxes.value.push(data as Timebox)
        // Sort by start_time
        timeboxes.value.sort((a, b) => a.start_time.localeCompare(b.start_time))
      }
      return data as Timebox
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create timebox'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTimebox(id: string, updates: TimeboxUpdate) {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('timeboxes')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      if (data) {
        const index = timeboxes.value.findIndex((tb) => tb.id === id)
        if (index !== -1) {
          timeboxes.value[index] = data as Timebox
        }
      }
      return data as Timebox
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update timebox'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTimebox(id: string) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('timeboxes')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      timeboxes.value = timeboxes.value.filter((tb) => tb.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete timebox'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleComplete(id: string) {
    const timebox = timeboxById(id)
    if (!timebox) return

    return updateTimebox(id, { is_completed: !timebox.is_completed })
  }

  function handleRealtimeUpdate(payload: {
    eventType: string
    new: Timebox | null
    old: { id: string } | null
  }) {
    if (payload.eventType === 'INSERT' && payload.new) {
      const exists = timeboxes.value.some((tb) => tb.id === payload.new!.id)
      if (!exists) {
        timeboxes.value.push(payload.new)
        timeboxes.value.sort((a, b) => a.start_time.localeCompare(b.start_time))
      }
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const index = timeboxes.value.findIndex((tb) => tb.id === payload.new!.id)
      if (index !== -1) {
        timeboxes.value[index] = payload.new
      }
    } else if (payload.eventType === 'DELETE' && payload.old) {
      timeboxes.value = timeboxes.value.filter((tb) => tb.id !== payload.old!.id)
    }
  }

  return {
    timeboxes,
    loading,
    error,
    timeboxesByDate,
    timeboxById,
    fetchTimeboxesByDate,
    createTimebox,
    updateTimebox,
    deleteTimebox,
    toggleComplete,
    handleRealtimeUpdate,
  }
})
