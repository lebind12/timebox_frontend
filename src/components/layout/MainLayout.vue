<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AppHeader from './AppHeader.vue'
import TodoList from '@/components/todo/TodoList.vue'
import DailyTaskList from '@/components/daily/DailyTaskList.vue'

const uiStore = useUiStore()

const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)
const sidebarTab = ref('todos')

function handleResizeStart(event: MouseEvent) {
  isResizing.value = true
  startX.value = event.clientX
  startWidth.value = uiStore.sidebarWidth

  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

function handleResizeMove(event: MouseEvent) {
  if (!isResizing.value) return

  const deltaX = event.clientX - startX.value
  const newWidth = startWidth.value + deltaX
  uiStore.setSidebarWidth(newWidth)
}

function handleResizeEnd() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
})
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <AppHeader />

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <aside
        class="border-r bg-muted/30 flex flex-col shrink-0 transition-transform duration-300 relative"
        :class="{
          'translate-x-0': uiStore.sidebarOpen,
          '-translate-x-full absolute lg:translate-x-0 lg:relative': !uiStore.sidebarOpen,
        }"
        :style="{ width: `${uiStore.sidebarWidth}px` }"
      >
        <Tabs v-model="sidebarTab" class="flex-1 flex flex-col overflow-hidden">
          <TabsList class="grid w-full grid-cols-2 mx-4 mt-4" style="width: calc(100% - 2rem)">
            <TabsTrigger value="todos">할일</TabsTrigger>
            <TabsTrigger value="daily">매일 할일</TabsTrigger>
          </TabsList>

          <TabsContent value="todos" class="flex-1 overflow-hidden p-4 pt-2 mt-0">
            <TodoList />
          </TabsContent>

          <TabsContent value="daily" class="flex-1 overflow-hidden p-4 pt-2 mt-0">
            <DailyTaskList />
          </TabsContent>
        </Tabs>

        <!-- Resize handle -->
        <div
          class="absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/30 transition-colors group"
          :class="{ 'bg-primary/30': isResizing }"
          @mousedown="handleResizeStart"
        >
          <div
            class="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-8 rounded-full bg-border group-hover:bg-primary/50 transition-colors"
            :class="{ 'bg-primary/50': isResizing }"
          />
        </div>
      </aside>

      <!-- Main Content (Timebox Schedule) -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>
