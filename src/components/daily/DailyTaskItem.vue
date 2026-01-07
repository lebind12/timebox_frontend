<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useDailyTasksStore } from '@/stores/dailyTasks'
import { toast } from 'vue-sonner'
import type { DailyTask } from '@/types'

const props = defineProps<{
  task: DailyTask
}>()

const emit = defineEmits<{
  edit: [task: DailyTask]
  addToSchedule: [task: DailyTask]
}>()

const dailyTasksStore = useDailyTasksStore()

function formatTime(time: string | null): string {
  if (!time) return ''
  return time.slice(0, 5)
}

async function handleToggleActive() {
  try {
    await dailyTasksStore.toggleActive(props.task.id)
  } catch {
    toast.error('상태 변경에 실패했습니다.')
  }
}

async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await dailyTasksStore.deleteDailyTask(props.task.id)
    toast.success('매일 할 일이 삭제되었습니다.')
  } catch {
    toast.error('삭제에 실패했습니다.')
  }
}

function handleDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/json', JSON.stringify({
      id: props.task.id,
      title: props.task.title,
      duration_minutes: props.task.default_duration_minutes,
      isDailyTask: true,
    }))
  }
}
</script>

<template>
  <div
    class="p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors group cursor-move"
    :class="{ 'opacity-50': !task.is_active }"
    draggable="true"
    @dragstart="handleDragStart"
  >
    <div class="flex items-start gap-2">
      <Checkbox
        :checked="task.is_active"
        @update:checked="handleToggleActive"
        class="mt-0.5"
        @click.stop
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">
          {{ task.title }}
        </p>
        <p class="text-xs text-muted-foreground">
          <span v-if="task.default_start_time">{{ formatTime(task.default_start_time) }} </span>
          <span>{{ task.default_duration_minutes }}분</span>
        </p>
      </div>
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0"
          @click.stop="emit('addToSchedule', task)"
          title="오늘 일정에 추가"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0"
          @click.stop="emit('edit', task)"
          title="수정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 text-destructive"
          @click.stop="handleDelete"
          title="삭제"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Button>
      </div>
    </div>
  </div>
</template>
