<script setup lang="ts">
import { computed } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useTimeboxesStore } from '@/stores/timeboxes'
import { toast } from 'vue-sonner'
import type { Timebox } from '@/types'

const props = defineProps<{
  timebox: Timebox
  pixelPerMinute: number
  overrideHeight?: number
}>()

const emit = defineEmits<{
  startMove: [timebox: Timebox, event: DragEvent]
  startResize: [timebox: Timebox, event: MouseEvent]
}>()

const timeboxesStore = useTimeboxesStore()

const heightPx = computed(() => {
  if (props.overrideHeight !== undefined) {
    return props.overrideHeight
  }
  return props.timebox.duration_minutes * props.pixelPerMinute
})

// 리사이즈 중인지 여부는 overrideHeight prop으로 판단
const isResizing = computed(() => props.overrideHeight !== undefined)

function handleResizeStart(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  emit('startResize', props.timebox, event)
}

function formatTime(time: string): string {
  return time.slice(0, 5)
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

</script>

<template>
  <div
    class="absolute left-0 right-0 mx-0.5 sm:mx-1 xl:mx-1.5 2xl:mx-2 rounded-md border bg-primary/10 border-primary/30 overflow-hidden group cursor-move select-none"
    :style="{ height: `${heightPx}px`, minHeight: '24px' }"
    draggable="true"
    @dragstart="handleDragStart"
  >
    <div class="flex items-start p-1 sm:p-1.5 lg:p-2 xl:p-2.5 2xl:p-3 h-full">
      <Checkbox
        :checked="timebox.is_completed"
        @update:checked="handleToggleComplete"
        class="mt-0.5 shrink-0 size-3 sm:size-4 lg:size-5 xl:size-5 2xl:size-6"
        @click.stop
      />
      <div class="flex-1 min-w-0 ml-1 sm:ml-1.5 lg:ml-2 xl:ml-2.5 2xl:ml-3">
        <p
          class="text-[10px] sm:text-xs lg:text-sm xl:text-base 2xl:text-lg font-medium truncate"
          :class="{ 'line-through text-muted-foreground': timebox.is_completed }"
        >
          {{ timebox.title }}
        </p>
        <p class="text-[8px] sm:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-muted-foreground">
          {{ formatTime(timebox.start_time) }} ({{ timebox.duration_minutes }}분)
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        class="size-4 sm:size-5 lg:size-6 xl:size-7 2xl:size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        @click.stop="handleDelete"
        title="삭제"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="size-2.5 sm:size-3 lg:size-3.5 xl:size-4 2xl:size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </Button>
    </div>

    <!-- Resize handle -->
    <div
      class="absolute bottom-0 left-0 right-0 h-1.5 sm:h-2 xl:h-2.5 2xl:h-3 cursor-ns-resize bg-transparent hover:bg-primary/30 transition-colors group-hover:bg-primary/10"
      @mousedown="handleResizeStart"
    >
      <div class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 sm:w-8 xl:w-10 2xl:w-12 h-0.5 sm:h-1 xl:h-1 2xl:h-1.5 rounded-full bg-primary/30 group-hover:bg-primary/50" />
    </div>
  </div>
</template>
