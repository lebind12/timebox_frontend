<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'vue-sonner'

const props = defineProps<{
  mode: 'login' | 'register'
}>()

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!email.value || !password.value) {
    toast.error('이메일과 비밀번호를 입력해주세요.')
    return
  }

  if (props.mode === 'register' && password.value !== confirmPassword.value) {
    toast.error('비밀번호가 일치하지 않습니다.')
    return
  }

  loading.value = true

  try {
    if (props.mode === 'login') {
      await authStore.signIn(email.value, password.value)
      toast.success('로그인 성공!')
      router.push('/')
    } else {
      await authStore.signUp(email.value, password.value)
      toast.success('회원가입 성공! 이메일을 확인해주세요.')
      router.push('/login')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '오류가 발생했습니다.'
    toast.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>{{ mode === 'login' ? '로그인' : '회원가입' }}</CardTitle>
      <CardDescription>
        {{ mode === 'login' ? '계정에 로그인하세요.' : '새 계정을 만드세요.' }}
      </CardDescription>
    </CardHeader>
    <form @submit.prevent="handleSubmit">
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="email">이메일</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="email@example.com"
            required
          />
        </div>
        <div class="space-y-2">
          <Label for="password">비밀번호</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>
        <div v-if="mode === 'register'" class="space-y-2">
          <Label for="confirmPassword">비밀번호 확인</Label>
          <Input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>
      </CardContent>
      <CardFooter class="flex flex-col gap-4">
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? '처리 중...' : (mode === 'login' ? '로그인' : '회원가입') }}
        </Button>
        <p class="text-sm text-muted-foreground text-center">
          <template v-if="mode === 'login'">
            계정이 없으신가요?
            <router-link to="/register" class="text-primary hover:underline">
              회원가입
            </router-link>
          </template>
          <template v-else>
            이미 계정이 있으신가요?
            <router-link to="/login" class="text-primary hover:underline">
              로그인
            </router-link>
          </template>
        </p>
      </CardFooter>
    </form>
  </Card>
</template>
