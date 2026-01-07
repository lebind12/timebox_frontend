<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTodosStore } from '@/stores/todos'
import { toast } from 'vue-sonner'
import type { Todo } from '@/types'

const props = defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  edit: [todo: Todo]
}>()

const todosStore = useTodosStore()

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const priorityLabels = {
  low: '낮음',
  medium: '보통',
  high: '높음',
}

async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await todosStore.deleteTodo(props.todo.id)
    toast.success('할일이 삭제되었습니다.')
  } catch {
    toast.error('삭제에 실패했습니다.')
  }
}

async function handleArchive() {
  try {
    await todosStore.archiveTodo(props.todo.id)
    toast.success('할일이 보관되었습니다.')
  } catch {
    toast.error('보관에 실패했습니다.')
  }
}

function onDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(props.todo))
    event.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<template>
  <Card
    class="p-3 cursor-grab hover:shadow-md transition-shadow"
    draggable="true"
    @dragstart="onDragStart"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h4 class="font-medium truncate">{{ todo.title }}</h4>
        <p v-if="todo.description" class="text-sm text-muted-foreground truncate">
          {{ todo.description }}
        </p>
        <span
          :class="[
            'inline-block mt-2 px-2 py-0.5 text-xs rounded-full',
            priorityColors[todo.priority],
          ]"
        >
          {{ priorityLabels[todo.priority] }}
        </span>
      </div>
      <div class="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0"
          @click="emit('edit', todo)"
          title="수정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0"
          @click="handleArchive"
          title="보관"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0 text-destructive hover:text-destructive"
          @click="handleDelete"
          title="삭제"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </Button>
      </div>
    </div>
  </Card>
</template>
