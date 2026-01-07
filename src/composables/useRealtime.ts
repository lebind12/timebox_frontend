import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useTimeboxesStore } from '@/stores/timeboxes'
import { useTodosStore } from '@/stores/todos'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtime() {
  const timeboxesStore = useTimeboxesStore()
  const todosStore = useTodosStore()

  let timeboxChannel: RealtimeChannel | null = null
  let todoChannel: RealtimeChannel | null = null

  function setupSubscriptions() {
    // Subscribe to timebox changes
    timeboxChannel = supabase
      .channel('timeboxes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timeboxes' },
        (payload) => {
          timeboxesStore.handleRealtimeUpdate({
            eventType: payload.eventType,
            new: payload.new as any,
            old: payload.old as any,
          })
        }
      )
      .subscribe()

    // Subscribe to todo changes
    todoChannel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          todosStore.handleRealtimeUpdate({
            eventType: payload.eventType,
            new: payload.new as any,
            old: payload.old as any,
          })
        }
      )
      .subscribe()
  }

  function cleanupSubscriptions() {
    if (timeboxChannel) {
      supabase.removeChannel(timeboxChannel)
      timeboxChannel = null
    }
    if (todoChannel) {
      supabase.removeChannel(todoChannel)
      todoChannel = null
    }
  }

  onMounted(() => {
    setupSubscriptions()
  })

  onUnmounted(() => {
    cleanupSubscriptions()
  })

  return {
    setupSubscriptions,
    cleanupSubscriptions,
  }
}
