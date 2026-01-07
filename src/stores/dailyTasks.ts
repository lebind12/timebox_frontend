import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { DailyTask, DailyTaskInsert, DailyTaskUpdate } from '@/types'

export const useDailyTasksStore = defineStore('dailyTasks', () => {
  const dailyTasks = ref<DailyTask[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  const activeDailyTasks = computed(() =>
    dailyTasks.value.filter((task) => task.is_active)
  )

  function dailyTaskById(id: string) {
    return dailyTasks.value.find((task) => task.id === id)
  }

  async function fetchDailyTasks() {
    if (!authStore.userId) return

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', authStore.userId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      dailyTasks.value = (data as DailyTask[]) ?? []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch daily tasks'
    } finally {
      loading.value = false
    }
  }

  async function addDailyTask(task: Omit<DailyTaskInsert, 'user_id'>) {
    if (!authStore.userId) return

    loading.value = true
    error.value = null

    try {
      const insertData = { ...task, user_id: authStore.userId } as DailyTaskInsert
      const { data, error: insertError } = await supabase
        .from('daily_tasks')
        .insert(insertData as never)
        .select()
        .single()

      if (insertError) throw insertError
      if (data) {
        dailyTasks.value.push(data as DailyTask)
      }
      return data as DailyTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add daily task'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateDailyTask(id: string, updates: DailyTaskUpdate) {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('daily_tasks')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      if (data) {
        const index = dailyTasks.value.findIndex((t) => t.id === id)
        if (index !== -1) {
          dailyTasks.value[index] = data as DailyTask
        }
      }
      return data as DailyTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update daily task'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteDailyTask(id: string) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      dailyTasks.value = dailyTasks.value.filter((t) => t.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete daily task'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleActive(id: string) {
    const task = dailyTaskById(id)
    if (!task) return

    return updateDailyTask(id, { is_active: !task.is_active })
  }

  return {
    dailyTasks,
    loading,
    error,
    activeDailyTasks,
    dailyTaskById,
    fetchDailyTasks,
    addDailyTask,
    updateDailyTask,
    deleteDailyTask,
    toggleActive,
  }
})
