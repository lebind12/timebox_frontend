import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Todo } from '@/types'

export interface PendingDrop {
  todo: Todo
  startTime: string
}

export const useUiStore = defineStore('ui', () => {
  const selectedDate = ref<Date>(new Date())
  const isDurationModalOpen = ref(false)
  const pendingDrop = ref<PendingDrop | null>(null)
  const sidebarOpen = ref(true)

  function setSelectedDate(date: Date) {
    selectedDate.value = date
  }

  function openDurationModal(drop: PendingDrop) {
    pendingDrop.value = drop
    isDurationModalOpen.value = true
  }

  function closeDurationModal() {
    isDurationModalOpen.value = false
    pendingDrop.value = null
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  return {
    selectedDate,
    isDurationModalOpen,
    pendingDrop,
    sidebarOpen,
    setSelectedDate,
    openDurationModal,
    closeDurationModal,
    toggleSidebar,
  }
})
