<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { toast } from 'vue-sonner'
import { CalendarDate, type DateValue } from '@internationalized/date'

const authStore = useAuthStore()
const uiStore = useUiStore()

const calendarValue = computed({
  get: () => {
    const d = uiStore.selectedDate
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
  },
  set: (val: DateValue | undefined) => {
    if (val) {
      const date = new Date(val.year, val.month - 1, val.day)
      uiStore.setSelectedDate(date)
    }
  },
})

const formattedDate = computed(() => {
  const d = uiStore.selectedDate
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }
  return d.toLocaleDateString('ko-KR', options)
})

function goToToday() {
  uiStore.setSelectedDate(new Date())
}

function goToPrevDay() {
  const prev = new Date(uiStore.selectedDate)
  prev.setDate(prev.getDate() - 1)
  uiStore.setSelectedDate(prev)
}

function goToNextDay() {
  const next = new Date(uiStore.selectedDate)
  next.setDate(next.getDate() + 1)
  uiStore.setSelectedDate(next)
}

async function handleLogout() {
  try {
    await authStore.signOut()
    toast.success('로그아웃 되었습니다.')
  } catch {
    toast.error('로그아웃에 실패했습니다.')
  }
}
</script>

<template>
  <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="flex items-center justify-between h-14 px-4">
      <div class="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          class="lg:hidden"
          @click="uiStore.toggleSidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </Button>

        <h1 class="text-lg font-bold">Timebox</h1>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="goToPrevDay">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Button>

        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="min-w-[200px]">
              {{ formattedDate }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="center">
            <Calendar v-model="calendarValue" />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" @click="goToNextDay">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </Button>

        <Button variant="outline" size="sm" @click="goToToday">
          오늘
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground hidden sm:inline">
          {{ authStore.user?.email }}
        </span>
        <Button variant="ghost" size="sm" @click="handleLogout">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          <span class="ml-1 hidden sm:inline">로그아웃</span>
        </Button>
      </div>
    </div>
  </header>
</template>
