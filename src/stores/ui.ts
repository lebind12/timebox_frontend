import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Todo } from '@/types'

export interface PendingDrop {
  todo: Todo
  startTime: string
}

export type ViewMode = 'day' | 'week' | 'month'

const SIDEBAR_WIDTH_KEY = 'timebox-sidebar-width'
const DEFAULT_SIDEBAR_WIDTH = 320
const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 500

export const useUiStore = defineStore('ui', () => {
  const selectedDate = ref<Date>(new Date())
  const isDurationModalOpen = ref(false)
  const pendingDrop = ref<PendingDrop | null>(null)
  const sidebarOpen = ref(true)
  const viewMode = ref<ViewMode>('day')

  // 사이드바 너비 (localStorage에서 복원)
  const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY)
  const sidebarWidth = ref(savedWidth ? parseInt(savedWidth) : DEFAULT_SIDEBAR_WIDTH)

  // 사이드바 너비 변경 시 localStorage에 저장
  watch(sidebarWidth, (newWidth) => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(newWidth))
  })

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

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  function setSidebarWidth(width: number) {
    sidebarWidth.value = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width))
  }

  return {
    selectedDate,
    isDurationModalOpen,
    pendingDrop,
    sidebarOpen,
    viewMode,
    sidebarWidth,
    setSelectedDate,
    openDurationModal,
    closeDurationModal,
    toggleSidebar,
    setViewMode,
    setSidebarWidth,
    MIN_SIDEBAR_WIDTH,
    MAX_SIDEBAR_WIDTH,
  }
})
