<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import AppHeader from './AppHeader.vue'
import TodoList from '@/components/todo/TodoList.vue'

const uiStore = useUiStore()
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <AppHeader />

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar (Todo List) -->
      <aside
        class="w-80 border-r bg-muted/30 flex flex-col shrink-0 transition-all duration-300"
        :class="{
          'translate-x-0': uiStore.sidebarOpen,
          '-translate-x-full absolute lg:translate-x-0 lg:relative': !uiStore.sidebarOpen,
        }"
      >
        <div class="flex-1 overflow-hidden p-4">
          <TodoList />
        </div>
      </aside>

      <!-- Main Content (Timebox Schedule) -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>
