<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import DailyTaskItem from './DailyTaskItem.vue'
import DailyTaskForm from './DailyTaskForm.vue'
import { useDailyTasksStore } from '@/stores/dailyTasks'
import { useTimeboxesStore } from '@/stores/timeboxes'
import { useUiStore } from '@/stores/ui'
import { toast } from 'vue-sonner'
import type { DailyTask } from '@/types'

const dailyTasksStore = useDailyTasksStore()
const timeboxesStore = useTimeboxesStore()
const uiStore = useUiStore()

const isFormOpen = ref(false)
const editingTask = ref<DailyTask | null>(null)

onMounted(() => {
  dailyTasksStore.fetchDailyTasks()
})

function handleEdit(task: DailyTask) {
  editingTask.value = task
  isFormOpen.value = true
}

function handleFormClose(open: boolean) {
  isFormOpen.value = open
  if (!open) {
    editingTask.value = null
  }
}

async function handleAddToSchedule(task: DailyTask) {
  try {
    const date = uiStore.selectedDate.toISOString().split('T')[0]
    const startTime = task.default_start_time || '09:00:00'

    await timeboxesStore.createTimebox({
      date: date as string,
      start_time: startTime,
      duration_minutes: task.default_duration_minutes,
      title: task.title,
    })

    toast.success('오늘 일정에 추가되었습니다.')
  } catch {
    toast.error('일정 추가에 실패했습니다.')
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">매일 할 일</h2>
      <Button size="sm" @click="isFormOpen = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        추가
      </Button>
    </div>

    <div v-if="dailyTasksStore.loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="dailyTasksStore.dailyTasks.length === 0" class="flex-1 flex items-center justify-center text-muted-foreground">
      <p class="text-center text-sm">
        매일 반복되는 일정을<br />등록해보세요.
      </p>
    </div>

    <div v-else class="flex-1 overflow-auto space-y-2">
      <DailyTaskItem
        v-for="task in dailyTasksStore.dailyTasks"
        :key="task.id"
        :task="task"
        @edit="handleEdit"
        @add-to-schedule="handleAddToSchedule"
      />
    </div>

    <DailyTaskForm
      :open="isFormOpen"
      :task="editingTask"
      @update:open="handleFormClose"
    />
  </div>
</template>
