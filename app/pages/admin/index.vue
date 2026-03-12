<script setup lang="ts">
const email = ref('tpetrovic@singimail.rs')
const password = ref('')
const loading = ref(false)
const error = ref('')
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

if (authState.value?.isAdmin) {
  await navigateTo('/admin/tests')
}

async function login() {
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/admin', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
      },
    })

    await navigateTo('/admin/tests')
  } catch (fetchError: any) {
    error.value = fetchError.data?.message || 'Admin login failed'
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
          <h1 class="text-xl font-semibold">Admin Login</h1>
          <p class="text-sm text-muted">Enter your email and password to manage tests, students, and results.</p>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField label="Email" required>
          <UInput
            v-model="email"
            type="email"
            class="w-full"
            @keyup.enter="login"
          />
        </UFormField>

        <UFormField label="Password" required>
          <UInput
            v-model="password"
            type="password"
            class="w-full"
            placeholder="Enter password"
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
