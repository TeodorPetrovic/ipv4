<script setup lang="ts">
const name = ref('')
const studentId = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  if (!name.value.trim() || !studentId.value.trim()) {
    error.value = 'Please enter both name and student ID'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { name: name.value.trim(), studentId: studentId.value.trim() }
    })
    navigateTo('/test')
  } catch (e: any) {
    error.value = e.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">IPv4 Test Platform</h1>
          <p class="text-gray-500 mt-1">Enter your details to begin</p>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField label="Full Name">
          <UInput v-model="name" placeholder="Enter your full name" size="lg" @keyup.enter="login" />
        </UFormField>
        <UFormField label="Student ID">
          <UInput v-model="studentId" placeholder="Enter your student ID" size="lg" @keyup.enter="login" />
        </UFormField>
        <UAlert v-if="error" color="red" :title="error" />
      </div>

      <template #footer>
        <UButton block size="lg" :loading="loading" @click="login">Start Test</UButton>
      </template>
    </UCard>
  </div>
</template>
