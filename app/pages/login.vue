<script setup lang="ts">
const studentId = ref('')
const loading = ref(false)
const error = ref('')
const { t } = useAppI18n()
const { authState, ensureAuthSession, refreshAuthSession } = useAuthSession()
await ensureAuthSession()

if (authState.value?.student) {
  await navigateTo('/tests')
}

async function login() {
  error.value = ''

  if (!studentId.value.trim()) {
    error.value = t('login.errors.studentIdRequired')
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

    await refreshAuthSession()
    await navigateTo('/tests')
  } catch (fetchError: any) {
    error.value = fetchError.data?.message || t('login.errors.studentLoginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen">
    <div class="absolute right-4 top-4 z-10 flex items-center gap-2">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>

    <UContainer class="flex min-h-screen max-w-md items-center justify-center">
      <UCard class="w-full">
        <template #header>
          <div class="space-y-1">
            <h1 class="text-xl font-semibold">{{ t('login.studentTitle') }}</h1>
            <p class="text-sm text-muted">{{ t('login.studentDescription') }}</p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField :label="t('login.studentIdLabel')" required>
            <UInput
              v-model="studentId"
              class="w-full"
              :placeholder="t('login.studentIdPlaceholder')"
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
            {{ t('common.continue') }}
          </UButton>
        </template>
      </UCard>
    </UContainer>
  </div>
</template>
