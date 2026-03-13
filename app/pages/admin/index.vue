<script setup lang="ts">
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const { t } = useAppI18n()
const { authState, ensureAuthSession, refreshAuthSession } = useAuthSession()
await ensureAuthSession()

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

    await refreshAuthSession()
    await navigateTo('/admin/tests')
  } catch (fetchError: any) {
    error.value = fetchError.data?.message || t('login.errors.adminLoginFailed')
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
            <h1 class="text-xl font-semibold">{{ t('login.adminTitle') }}</h1>
            <p class="text-sm text-muted">{{ t('login.adminDescription') }}</p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField :label="t('login.emailLabel')" required>
            <UInput
              v-model="email"
              type="email"
              class="w-full"
              @keyup.enter="login"
            />
          </UFormField>

          <UFormField :label="t('login.passwordLabel')" required>
            <UInput
              v-model="password"
              type="password"
              class="w-full"
              :placeholder="t('login.passwordPlaceholder')"
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
