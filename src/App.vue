<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <Toaster position="bottom-left" :rich-colors="true" :expand="true" />
  <router-view />
</template>
