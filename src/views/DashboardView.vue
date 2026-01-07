<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue'
import TimeboxSchedule from '@/components/timebox/TimeboxSchedule.vue'
import { useRealtime } from '@/composables/useRealtime'

// Setup realtime subscriptions
useRealtime()
</script>

<template>
  <MainLayout>
    <TimeboxSchedule />
  </MainLayout>
</template>
