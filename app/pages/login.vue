<script setup lang="ts">
import type { AuthState } from '#shared/types/api'

const studentId = ref('')
const loading = ref(false)
const error = ref('')
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
  headers: requestHeaders,
})

if (authState.value?.student) {
  await navigateTo('/tests')
}

async function login() {
  error.value = ''

  if (!studentId.value.trim()) {
    error.value = 'Student ID is required'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        studentId: studentId.value.trim(),
      },
    })

    await navigateTo('/tests')
  } catch (fetchError: any) {
    error.value = fetchError.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="flex min-h-screen max-w-md items-center justify-center">
    <UCard class="w-full">
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold">Student Login</h1>
          <p class="text-sm text-muted">Enter your student ID to view available tests.</p>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField label="Student ID" required>
          <UInput
            v-model="studentId"
            class="w-full"
            placeholder="2024123456"
            icon="i-lucide-id-card"
            @keyup.enter="login"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
        />
      </div>

      <template #footer>
        <UButton block :loading="loading" @click="login">
          Continue
        </UButton>
      </template>
    </UCard>
  </UContainer>
</template>
