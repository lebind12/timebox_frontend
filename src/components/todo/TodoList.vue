<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TodoItem from './TodoItem.vue'
import TodoForm from './TodoForm.vue'
import { useTodosStore } from '@/stores/todos'
import { useUiStore } from '@/stores/ui'
import type { Todo } from '@/types'
import type { ViewMode } from '@/stores/ui'

const todosStore = useTodosStore()
const uiStore = useUiStore()

const isFormOpen = ref(false)
const editingTodo = ref<Todo | null>(null)

// 주간 날짜 범위 계산
const weekRange = computed(() => {
  const date = uiStore.selectedDate
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // 월요일 시작
  const monday = new Date(date)
  monday.setDate(diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
})


// 날짜 포맷
function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatMonth(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

onMounted(() => {
  todosStore.fetchTodos()
})

function handleEdit(todo: Todo) {
  editingTodo.value = todo
  isFormOpen.value = true
}

function handleFormClose(open: boolean) {
  isFormOpen.value = open
  if (!open) {
    editingTodo.value = null
  }
}

function handleTabChange(value: string | number) {
  uiStore.setViewMode(String(value) as ViewMode)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">할일 목록</h2>
      <Button size="sm" @click="isFormOpen = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        추가
      </Button>
    </div>

    <Tabs :default-value="uiStore.viewMode" class="flex-1 flex flex-col overflow-hidden" @update:model-value="handleTabChange">
      <TabsList class="grid w-full grid-cols-3 mb-3">
        <TabsTrigger value="day">일</TabsTrigger>
        <TabsTrigger value="week">주</TabsTrigger>
        <TabsTrigger value="month">월</TabsTrigger>
      </TabsList>

      <!-- 일간 뷰 -->
      <TabsContent value="day" class="flex-1 overflow-auto mt-0">
        <div class="text-xs text-muted-foreground mb-2">
          {{ uiStore.selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) }}
        </div>

        <div v-if="todosStore.loading" class="flex-1 flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else-if="todosStore.activeTodos.length === 0" class="flex-1 flex items-center justify-center text-muted-foreground py-8">
          <p>할일이 없습니다.</p>
        </div>

        <div v-else class="space-y-2">
          <TodoItem
            v-for="todo in todosStore.activeTodos"
            :key="todo.id"
            :todo="todo"
            @edit="handleEdit"
          />
        </div>
      </TabsContent>

      <!-- 주간 뷰 -->
      <TabsContent value="week" class="flex-1 overflow-auto mt-0">
        <div class="text-xs text-muted-foreground mb-2">
          {{ formatDateShort(weekRange.start) }} - {{ formatDateShort(weekRange.end) }}
        </div>

        <div v-if="todosStore.loading" class="flex-1 flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else-if="todosStore.activeTodos.length === 0" class="flex-1 flex items-center justify-center text-muted-foreground py-8">
          <p>이번 주 할일이 없습니다.</p>
        </div>

        <div v-else class="space-y-2">
          <TodoItem
            v-for="todo in todosStore.activeTodos"
            :key="todo.id"
            :todo="todo"
            @edit="handleEdit"
          />
        </div>
      </TabsContent>

      <!-- 월간 뷰 -->
      <TabsContent value="month" class="flex-1 overflow-auto mt-0">
        <div class="text-xs text-muted-foreground mb-2">
          {{ formatMonth(uiStore.selectedDate) }}
        </div>

        <div v-if="todosStore.loading" class="flex-1 flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else-if="todosStore.activeTodos.length === 0" class="flex-1 flex items-center justify-center text-muted-foreground py-8">
          <p>이번 달 할일이 없습니다.</p>
        </div>

        <div v-else class="space-y-2">
          <TodoItem
            v-for="todo in todosStore.activeTodos"
            :key="todo.id"
            :todo="todo"
            @edit="handleEdit"
          />
        </div>
      </TabsContent>
    </Tabs>

    <TodoForm
      :open="isFormOpen"
      :todo="editingTodo"
      @update:open="handleFormClose"
    />
  </div>
</template>
