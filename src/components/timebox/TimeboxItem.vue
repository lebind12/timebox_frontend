<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useTimeboxesStore } from '@/stores/timeboxes'
import { toast } from 'vue-sonner'
import type { Timebox } from '@/types'

const props = defineProps<{
  timebox: Timebox
  pixelPerMinute: number
}>()

const emit = defineEmits<{
  startMove: [timebox: Timebox, event: DragEvent]
  startResize: [timebox: Timebox, event: MouseEvent]
}>()

const timeboxesStore = useTimeboxesStore()
const isResizing = ref(false)

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function getHeight(): number {
  return props.timebox.duration_minutes * props.pixelPerMinute
}

async function handleToggleComplete() {
  try {
    await timeboxesStore.toggleComplete(props.timebox.id)
  } catch {
    toast.error('상태 변경에 실패했습니다.')
  }
}

async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await timeboxesStore.deleteTimebox(props.timebox.id)
    toast.success('타임박스가 삭제되었습니다.')
  } catch {
    toast.error('삭제에 실패했습니다.')
  }
}

function handleDragStart(event: DragEvent) {
  if (isResizing.value) {
    event.preventDefault()
    return
  }

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('timebox/move', JSON.stringify(props.timebox))
  }
  emit('startMove', props.timebox, event)
}

function handleResizeStart(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  isResizing.value = true
  emit('startResize', props.timebox, event)
}
</script>

<template>
  <div
    class="absolute left-0 right-0 mx-1 rounded-md border bg-primary/10 border-primary/30 overflow-hidden group cursor-move select-none"
    :style="{ height: `${getHeight()}px`, minHeight: '24px' }"
    draggable="true"
    @dragstart="handleDragStart"
  >
    <div class="flex items-start p-2 h-full">
      <Checkbox
        :checked="timebox.is_completed"
        @update:checked="handleToggleComplete"
        class="mt-0.5 shrink-0"
        @click.stop
      />
      <div class="flex-1 min-w-0 ml-2">
        <p
          class="text-sm font-medium truncate"
          :class="{ 'line-through text-muted-foreground': timebox.is_completed }"
        >
          {{ timebox.title }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ formatTime(timebox.start_time) }} ({{ timebox.duration_minutes }}분)
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        @click.stop="handleDelete"
        title="삭제"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </Button>
    </div>

    <!-- Resize handle -->
    <div
      class="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-primary/30 transition-colors group-hover:bg-primary/10"
      @mousedown="handleResizeStart"
    >
      <div class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary/30 group-hover:bg-primary/50" />
    </div>
  </div>
</template>
