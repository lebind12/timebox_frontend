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
import { useDailyTasksStore } from '@/stores/dailyTasks'
import { toast } from 'vue-sonner'
import type { DailyTask } from '@/types'

const props = defineProps<{
  open: boolean
  task: DailyTask | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const dailyTasksStore = useDailyTasksStore()

const title = ref('')
const defaultStartTime = ref('')
const defaultDuration = ref('60')
const isSubmitting = ref(false)

const durationOptions = [
  { value: '5', label: '5분' },
  { value: '10', label: '10분' },
  { value: '15', label: '15분' },
  { value: '30', label: '30분' },
  { value: '45', label: '45분' },
  { value: '60', label: '1시간' },
  { value: '90', label: '1시간 30분' },
  { value: '120', label: '2시간' },
]

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.task) {
      title.value = props.task.title
      defaultStartTime.value = props.task.default_start_time?.slice(0, 5) || ''
      defaultDuration.value = String(props.task.default_duration_minutes)
    } else if (isOpen) {
      title.value = ''
      defaultStartTime.value = ''
      defaultDuration.value = '60'
    }
  }
)

async function handleSubmit() {
  if (!title.value.trim()) {
    toast.error('제목을 입력해주세요.')
    return
  }

  isSubmitting.value = true

  try {
    const data = {
      title: title.value.trim(),
      default_start_time: defaultStartTime.value ? `${defaultStartTime.value}:00` : null,
      default_duration_minutes: parseInt(defaultDuration.value),
    }

    if (props.task) {
      await dailyTasksStore.updateDailyTask(props.task.id, data)
      toast.success('매일 할 일이 수정되었습니다.')
    } else {
      await dailyTasksStore.addDailyTask(data)
      toast.success('매일 할 일이 추가되었습니다.')
    }

    emit('update:open', false)
  } catch {
    toast.error(props.task ? '수정에 실패했습니다.' : '추가에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>{{ task ? '매일 할 일 수정' : '매일 할 일 추가' }}</DialogTitle>
        <DialogDescription>
          매일 반복되는 일정을 등록하세요.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="title">제목</Label>
          <Input
            id="title"
            v-model="title"
            placeholder="매일 할 일 제목"
            autofocus
          />
        </div>

        <div class="space-y-2">
          <Label for="startTime">기본 시작 시간 (선택)</Label>
          <Input
            id="startTime"
            v-model="defaultStartTime"
            type="time"
          />
        </div>

        <div class="space-y-2">
          <Label for="duration">기본 소요 시간</Label>
          <Select v-model="defaultDuration">
            <SelectTrigger>
              <SelectValue placeholder="소요 시간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in durationOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            취소
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            {{ task ? '수정' : '추가' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
