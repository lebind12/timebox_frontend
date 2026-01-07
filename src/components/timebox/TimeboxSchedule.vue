<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import TimeboxItem from './TimeboxItem.vue'
import DurationModal from './DurationModal.vue'
import { useTimeboxesStore } from '@/stores/timeboxes'
import { useUiStore } from '@/stores/ui'
import { toast } from 'vue-sonner'
import type { Todo, Timebox } from '@/types'

const timeboxesStore = useTimeboxesStore()
const uiStore = useUiStore()

const PIXEL_PER_MINUTE = 2 // 5분 = 10px, 1시간 = 120px
const HOUR_HEIGHT = 60 * PIXEL_PER_MINUTE // 120px per hour

const scheduleRef = ref<HTMLDivElement | null>(null)
const dragOverTime = ref<string | null>(null)
const dragOverMinute = ref<number | null>(null)
const isDragging = ref(false)

// 리사이즈 관련 상태
const resizingTimeboxId = ref<string | null>(null)
const resizeStartY = ref(0)
const resizeStartDuration = ref(0)
const currentResizeDuration = ref(0)

// Generate all hours (0-23)
const hours = computed(() => {
  return Array.from({ length: 24 }, (_, i) => i)
})

// Calculate top offset for a timebox
function getTimeboxTop(timebox: Timebox): number {
  const parts = timebox.start_time.split(':')
  const hoursVal = parseInt(parts[0] || '0')
  const minutesVal = parseInt(parts[1] || '0')
  return (hoursVal * 60 + minutesVal) * PIXEL_PER_MINUTE
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

function handleDragEnter() {
  isDragging.value = true
}

// 스케줄 컨테이너 기준으로 분 단위 계산
function getMinutesFromEvent(event: DragEvent): number {
  if (!scheduleRef.value) return 0

  const rect = scheduleRef.value.getBoundingClientRect()
  // clientY는 뷰포트 기준, rect.top도 뷰포트 기준
  // 스크롤된 위치를 더해서 전체 컨테이너 기준 위치 계산
  const offsetY = event.clientY - rect.top + scheduleRef.value.scrollTop
  const totalMinutes = Math.floor(offsetY / PIXEL_PER_MINUTE / 5) * 5
  return Math.max(0, Math.min(totalMinutes, 24 * 60 - 5))
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()

  // 드래그 타입에 따라 효과 변경
  const isTimeboxMove = event.dataTransfer?.types.includes('timebox/move')
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = isTimeboxMove ? 'move' : 'copy'
  }

  const totalMinutes = getMinutesFromEvent(event)
  const displayHour = Math.floor(totalMinutes / 60)
  const displayMinute = totalMinutes % 60

  dragOverTime.value = `${displayHour.toString().padStart(2, '0')}:${displayMinute.toString().padStart(2, '0')}`
  dragOverMinute.value = totalMinutes
}

function handleDragLeave(event: DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }
  dragOverTime.value = null
  dragOverMinute.value = null
}

function handleDragEnd() {
  isDragging.value = false
  dragOverTime.value = null
  dragOverMinute.value = null
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  const totalMinutes = getMinutesFromEvent(event)

  dragOverTime.value = null
  dragOverMinute.value = null

  // 타임박스 이동 처리
  const timeboxData = event.dataTransfer?.getData('timebox/move')
  if (timeboxData) {
    try {
      const timebox: Timebox = JSON.parse(timeboxData)
      const newStartTime = minutesToTime(totalMinutes)

      await timeboxesStore.updateTimebox(timebox.id, { start_time: newStartTime })
      toast.success('타임박스가 이동되었습니다.')
    } catch (err) {
      console.error('Failed to move timebox:', err)
      toast.error('타임박스 이동에 실패했습니다.')
    }
    return
  }

  // 할일 드롭 처리
  const todoData = event.dataTransfer?.getData('application/json')
  if (!todoData) return

  try {
    const todo: Todo = JSON.parse(todoData)
    const dropHour = Math.floor(totalMinutes / 60)
    const dropMinute = totalMinutes % 60
    const startTime = `${dropHour.toString().padStart(2, '0')}:${dropMinute.toString().padStart(2, '0')}:00`

    uiStore.openDurationModal({
      todo,
      startTime,
    })
  } catch (err) {
    console.error('Failed to parse dropped todo:', err)
  }
}

// 타임박스 리사이즈 핸들러
function handleTimeboxResizeStart(timebox: Timebox, event: MouseEvent) {
  resizingTimeboxId.value = timebox.id
  resizeStartY.value = event.clientY
  resizeStartDuration.value = timebox.duration_minutes
  currentResizeDuration.value = timebox.duration_minutes

  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
  document.body.style.cursor = 'ns-resize'
  document.body.style.userSelect = 'none'
}

function handleResizeMove(event: MouseEvent) {
  if (!resizingTimeboxId.value) return

  const deltaY = event.clientY - resizeStartY.value
  const deltaMinutes = Math.round(deltaY / PIXEL_PER_MINUTE / 5) * 5
  const newDuration = Math.max(5, resizeStartDuration.value + deltaMinutes)

  // 최대 12시간 (720분)까지 제한
  currentResizeDuration.value = Math.min(720, newDuration)
}

async function handleResizeEnd() {
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  if (!resizingTimeboxId.value) return

  if (currentResizeDuration.value !== resizeStartDuration.value) {
    try {
      await timeboxesStore.updateTimebox(resizingTimeboxId.value, {
        duration_minutes: currentResizeDuration.value,
      })
      toast.success('타임박스 길이가 변경되었습니다.')
    } catch (err) {
      console.error('Failed to resize timebox:', err)
      toast.error('타임박스 변경에 실패했습니다.')
    }
  }

  resizingTimeboxId.value = null
  currentResizeDuration.value = 0
}

// 리사이즈 중인 타임박스의 높이 계산
function getTimeboxHeight(timebox: Timebox): number {
  if (resizingTimeboxId.value === timebox.id) {
    return currentResizeDuration.value * PIXEL_PER_MINUTE
  }
  return timebox.duration_minutes * PIXEL_PER_MINUTE
}

// Fetch timeboxes when date changes
watch(
  () => uiStore.selectedDate,
  (newDate) => {
    timeboxesStore.fetchTimeboxesByDate(newDate)
  },
  { immediate: true }
)

onMounted(() => {
  // Scroll to current hour
  const currentHour = new Date().getHours()
  if (scheduleRef.value) {
    scheduleRef.value.scrollTop = currentHour * HOUR_HEIGHT - 100
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
})
</script>

<template>
  <div
    ref="scheduleRef"
    class="flex-1 overflow-auto"
    @dragend="handleDragEnd"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="relative" :style="{ height: `${24 * HOUR_HEIGHT}px` }">
      <!-- Hour rows -->
      <div
        v-for="hour in hours"
        :key="hour"
        class="absolute left-0 right-0 flex"
        :style="{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px`, borderTop: '6px solid var(--border)' }"
      >
        <!-- Time label -->
        <div class="w-16 shrink-0 text-xs text-muted-foreground pr-2 pt-1 text-right">
          {{ formatHour(hour) }}
        </div>
        <!-- Drop zone -->
        <div class="flex-1 relative">
          <!-- 15-minute lines -->
          <div
            class="absolute left-0 right-0"
            :style="{ top: `${PIXEL_PER_MINUTE * 15}px`, borderTop: '2px dotted color-mix(in srgb, var(--border) 50%, transparent)' }"
          />
          <!-- 30-minute line -->
          <div
            class="absolute left-0 right-0"
            :style="{ top: `${HOUR_HEIGHT / 2}px`, borderTop: '4px dashed color-mix(in srgb, var(--border) 70%, transparent)' }"
          />
          <!-- 45-minute line -->
          <div
            class="absolute left-0 right-0"
            :style="{ top: `${PIXEL_PER_MINUTE * 45}px`, borderTop: '2px dotted color-mix(in srgb, var(--border) 50%, transparent)' }"
          />
        </div>
      </div>

      <!-- 5-minute slot highlight during drag -->
      <div
        v-if="isDragging && dragOverMinute !== null"
        class="absolute left-16 right-0 bg-primary/20 border-t-2 border-primary pointer-events-none transition-all duration-75"
        :style="{
          top: `${dragOverMinute * PIXEL_PER_MINUTE}px`,
          height: `${PIXEL_PER_MINUTE * 30}px`,
        }"
      />

      <!-- Timeboxes -->
      <div class="absolute left-16 right-0 pointer-events-none">
        <TimeboxItem
          v-for="timebox in timeboxesStore.timeboxesByDate"
          :key="timebox.id"
          :timebox="timebox"
          :pixel-per-minute="PIXEL_PER_MINUTE"
          :override-height="resizingTimeboxId === timebox.id ? getTimeboxHeight(timebox) : undefined"
          :style="{
            top: `${getTimeboxTop(timebox)}px`,
            pointerEvents: 'auto',
          }"
          @start-resize="handleTimeboxResizeStart"
        />
      </div>

      <!-- Current time indicator -->
      <div
        v-if="true"
        class="absolute left-16 right-0 border-t-2 border-red-500 pointer-events-none z-10"
        :style="{
          top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * PIXEL_PER_MINUTE}px`,
        }"
      >
        <div class="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-red-500" />
      </div>
    </div>

    <!-- Drop time indicator -->
    <div
      v-if="dragOverTime"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg z-50"
    >
      {{ dragOverTime }}
    </div>

    <!-- Resize duration indicator -->
    <div
      v-if="resizingTimeboxId"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg z-50"
    >
      {{ currentResizeDuration }}분
    </div>
  </div>

  <DurationModal />
</template>
