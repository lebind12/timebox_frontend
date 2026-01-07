<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useTimeboxesStore } from '@/stores/timeboxes'
import { toast } from 'vue-sonner'
import type { Timebox } from '@/types'

const props = defineProps<{
  timebox: Timebox
  pixelPerMinute: number
}>()

const timeboxesStore = useTimeboxesStore()

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
</script>

<template>
  <div
    class="absolute left-0 right-0 mx-1 rounded-md border bg-primary/10 border-primary/30 overflow-hidden group"
    :style="{ height: `${getHeight()}px`, minHeight: '24px' }"
  >
    <div class="flex items-start p-2 h-full">
      <Checkbox
        :checked="timebox.is_completed"
        @update:checked="handleToggleComplete"
        class="mt-0.5 shrink-0"
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
        @click="handleDelete"
        title="삭제"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </Button>
    </div>
  </div>
</template>
