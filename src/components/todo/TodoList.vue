<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import TodoItem from './TodoItem.vue'
import TodoForm from './TodoForm.vue'
import { useTodosStore } from '@/stores/todos'
import type { Todo } from '@/types'

const todosStore = useTodosStore()

const isFormOpen = ref(false)
const editingTodo = ref<Todo | null>(null)

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

    <div v-if="todosStore.loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="todosStore.activeTodos.length === 0" class="flex-1 flex items-center justify-center text-muted-foreground">
      <p>할일이 없습니다.</p>
    </div>

    <div v-else class="flex-1 overflow-auto space-y-2">
      <TodoItem
        v-for="todo in todosStore.activeTodos"
        :key="todo.id"
        :todo="todo"
        @edit="handleEdit"
      />
    </div>

    <TodoForm
      :open="isFormOpen"
      :todo="editingTodo"
      @update:open="handleFormClose"
    />
  </div>
</template>
