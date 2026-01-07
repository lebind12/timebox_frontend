<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
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
import { useUiStore } from '@/stores/ui'
import { useTimeboxesStore } from '@/stores/timeboxes'
import { toast } from 'vue-sonner'

const uiStore = useUiStore()
const timeboxesStore = useTimeboxesStore()

const selectedDuration = ref('60')
const loading = ref(false)

const durationOptions = [
  { value: '5', label: '5분' },
  { value: '15', label: '15분' },
  { value: '30', label: '30분' },
  { value: '45', label: '45분' },
  { value: '60', label: '1시간' },
  { value: '90', label: '1시간 30분' },
  { value: '120', label: '2시간' },
  { value: '180', label: '3시간' },
]

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] as string
}

async function handleConfirm() {
  if (!uiStore.pendingDrop) return

  loading.value = true

  try {
    await timeboxesStore.createTimebox({
      todo_id: uiStore.pendingDrop.todo.id,
      date: formatDate(uiStore.selectedDate),
      start_time: uiStore.pendingDrop.startTime,
      duration_minutes: parseInt(selectedDuration.value),
      title: uiStore.pendingDrop.todo.title,
      is_completed: false,
    })
    toast.success('타임박스가 추가되었습니다.')
    uiStore.closeDurationModal()
    selectedDuration.value = '60'
  } catch {
    toast.error('타임박스 추가에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  uiStore.closeDurationModal()
  selectedDuration.value = '60'
}
</script>

<template>
  <Dialog :open="uiStore.isDurationModalOpen" @update:open="handleCancel">
    <DialogContent class="sm:max-w-[350px]">
      <DialogHeader>
        <DialogTitle>소요 시간 설정</DialogTitle>
        <DialogDescription>
          <template v-if="uiStore.pendingDrop">
            "{{ uiStore.pendingDrop.todo.title }}"의 소요 시간을 선택하세요.
          </template>
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <div class="space-y-2">
          <Label for="duration">소요 시간</Label>
          <Select v-model="selectedDuration">
            <SelectTrigger>
              <SelectValue placeholder="시간 선택" />
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
        <p v-if="uiStore.pendingDrop" class="text-sm text-muted-foreground mt-4">
          시작 시간: {{ uiStore.pendingDrop.startTime }}
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" @click="handleCancel">
          취소
        </Button>
        <Button type="button" @click="handleConfirm" :disabled="loading">
          {{ loading ? '추가 중...' : '추가' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
