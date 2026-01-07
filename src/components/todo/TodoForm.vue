<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTodosStore } from '@/stores/todos'
import { toast } from 'vue-sonner'
import type { Todo } from '@/types'

const props = defineProps<{
  open: boolean
  todo?: Todo | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const todosStore = useTodosStore()

const title = ref('')
const description = ref('')
const priority = ref<'low' | 'medium' | 'high'>('medium')
const loading = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.todo) {
      title.value = props.todo.title
      description.value = props.todo.description ?? ''
      priority.value = props.todo.priority
    } else if (isOpen) {
      title.value = ''
      description.value = ''
      priority.value = 'medium'
    }
  }
)

async function handleSubmit() {
  if (!title.value.trim()) {
    toast.error('제목을 입력해주세요.')
    return
  }

  loading.value = true

  try {
    if (props.todo) {
      await todosStore.updateTodo(props.todo.id, {
        title: title.value.trim(),
        description: description.value.trim() || null,
        priority: priority.value,
      })
      toast.success('할일이 수정되었습니다.')
    } else {
      await todosStore.addTodo({
        title: title.value.trim(),
        description: description.value.trim() || null,
        priority: priority.value,
      })
      toast.success('할일이 추가되었습니다.')
    }
    emit('update:open', false)
  } catch {
    toast.error('오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ todo ? '할일 수정' : '새 할일' }}</DialogTitle>
        <DialogDescription>
          {{ todo ? '할일을 수정하세요.' : '새로운 할일을 추가하세요.' }}
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="title">제목</Label>
          <Input
            id="title"
            v-model="title"
            placeholder="할일 제목"
            required
          />
        </div>
        <div class="space-y-2">
          <Label for="description">설명 (선택)</Label>
          <Input
            id="description"
            v-model="description"
            placeholder="상세 설명"
          />
        </div>
        <div class="space-y-2">
          <Label for="priority">우선순위</Label>
          <Select v-model="priority">
            <SelectTrigger>
              <SelectValue placeholder="우선순위 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">낮음</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="high">높음</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            취소
          </Button>
          <Button type="submit" :disabled="loading">
            {{ loading ? '저장 중...' : (todo ? '수정' : '추가') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
