<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import TimeboxItem from './TimeboxItem.vue'
import DurationModal from './DurationModal.vue'
import { useTimeboxesStore } from '@/stores/timeboxes'
import { useUiStore } from '@/stores/ui'
import type { Todo, Timebox } from '@/types'

const timeboxesStore = useTimeboxesStore()
const uiStore = useUiStore()

const PIXEL_PER_MINUTE = 2 // 5분 = 10px, 1시간 = 120px
const HOUR_HEIGHT = 60 * PIXEL_PER_MINUTE // 120px per hour

const scheduleRef = ref<HTMLDivElement | null>(null)
const dragOverTime = ref<string | null>(null)

// Generate all hours (0-23)
const hours = computed(() => {
  return Array.from({ length: 24 }, (_, i) => i)
})

// Calculate top offset for a timebox within its hour
function getTimeboxTop(timebox: Timebox): number {
  const parts = timebox.start_time.split(':')
  const hoursVal = parseInt(parts[0] || '0')
  const minutesVal = parseInt(parts[1] || '0')
  return (hoursVal * 60 + minutesVal) * PIXEL_PER_MINUTE
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function handleDragOver(event: DragEvent, hour: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }

  // Calculate the exact time based on mouse position
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const offsetY = event.clientY - rect.top
  const minuteOffset = Math.floor(offsetY / PIXEL_PER_MINUTE / 5) * 5 // Round to 5 minutes
  const totalMinutes = hour * 60 + Math.min(minuteOffset, 55)
  const displayHour = Math.floor(totalMinutes / 60)
  const displayMinute = totalMinutes % 60

  dragOverTime.value = `${displayHour.toString().padStart(2, '0')}:${displayMinute.toString().padStart(2, '0')}`
}

function handleDragLeave() {
  dragOverTime.value = null
}

function handleDrop(event: DragEvent, hour: number) {
  event.preventDefault()
  dragOverTime.value = null

  const todoData = event.dataTransfer?.getData('application/json')
  if (!todoData) return

  try {
    const todo: Todo = JSON.parse(todoData)

    // Calculate drop time
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const offsetY = event.clientY - rect.top
    const minuteOffset = Math.floor(offsetY / PIXEL_PER_MINUTE / 5) * 5
    const totalMinutes = hour * 60 + Math.min(minuteOffset, 55)
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
</script>

<template>
  <div ref="scheduleRef" class="flex-1 overflow-auto">
    <div class="relative" :style="{ height: `${24 * HOUR_HEIGHT}px` }">
      <!-- Hour rows -->
      <div
        v-for="hour in hours"
        :key="hour"
        class="absolute left-0 right-0 border-t border-border flex"
        :style="{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }"
        @dragover="handleDragOver($event, hour)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, hour)"
      >
        <!-- Time label -->
        <div class="w-16 shrink-0 text-xs text-muted-foreground pr-2 pt-1 text-right">
          {{ formatHour(hour) }}
        </div>
        <!-- Drop zone -->
        <div
          class="flex-1 relative"
          :class="{ 'bg-primary/5': dragOverTime?.startsWith(hour.toString().padStart(2, '0')) }"
        >
          <!-- 30-minute line -->
          <div
            class="absolute left-0 right-0 border-t border-dashed border-border/50"
            :style="{ top: `${HOUR_HEIGHT / 2}px` }"
          />
        </div>
      </div>

      <!-- Timeboxes -->
      <div class="absolute left-16 right-0">
        <TimeboxItem
          v-for="timebox in timeboxesStore.timeboxesByDate"
          :key="timebox.id"
          :timebox="timebox"
          :pixel-per-minute="PIXEL_PER_MINUTE"
          :style="{ top: `${getTimeboxTop(timebox)}px` }"
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
  </div>

  <DurationModal />
</template>
