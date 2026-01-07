import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { Todo, TodoInsert, TodoUpdate } from '@/types'

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  const activeTodos = computed(() =>
    todos.value.filter((todo) => !todo.is_archived)
  )

  const archivedTodos = computed(() =>
    todos.value.filter((todo) => todo.is_archived)
  )

  function todoById(id: string) {
    return todos.value.find((todo) => todo.id === id)
  }

  async function fetchTodos() {
    if (!authStore.userId) return

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', authStore.userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      todos.value = (data as Todo[]) ?? []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch todos'
    } finally {
      loading.value = false
    }
  }

  async function addTodo(todo: Omit<TodoInsert, 'user_id'>) {
    if (!authStore.userId) return

    loading.value = true
    error.value = null

    try {
      const insertData = { ...todo, user_id: authStore.userId } as TodoInsert
      const { data, error: insertError } = await supabase
        .from('todos')
        .insert(insertData as never)
        .select()
        .single()

      if (insertError) throw insertError
      if (data) {
        todos.value.unshift(data as Todo)
      }
      return data as Todo
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add todo'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTodo(id: string, updates: TodoUpdate) {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('todos')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      if (data) {
        const index = todos.value.findIndex((t) => t.id === id)
        if (index !== -1) {
          todos.value[index] = data as Todo
        }
      }
      return data as Todo
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update todo'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTodo(id: string) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      todos.value = todos.value.filter((t) => t.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete todo'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function archiveTodo(id: string) {
    return updateTodo(id, { is_archived: true })
  }

  function handleRealtimeUpdate(payload: {
    eventType: string
    new: Todo | null
    old: { id: string } | null
  }) {
    if (payload.eventType === 'INSERT' && payload.new) {
      const exists = todos.value.some((t) => t.id === payload.new!.id)
      if (!exists) {
        todos.value.unshift(payload.new)
      }
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const index = todos.value.findIndex((t) => t.id === payload.new!.id)
      if (index !== -1) {
        todos.value[index] = payload.new
      }
    } else if (payload.eventType === 'DELETE' && payload.old) {
      todos.value = todos.value.filter((t) => t.id !== payload.old!.id)
    }
  }

  return {
    todos,
    loading,
    error,
    activeTodos,
    archivedTodos,
    todoById,
    fetchTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    archiveTodo,
    handleRealtimeUpdate,
  }
})
