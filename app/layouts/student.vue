<script setup lang="ts">
import type { AuthState } from '#shared/types/api'

const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.student) {
  await navigateTo('/login')
}

const profileItems = computed(() => [[
  {
    label: 'Logout',
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })

      await navigateTo('/login')
    },
  },
]])
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-default bg-default">
      <UContainer class="flex h-16 items-center justify-between gap-4">
        <p class="text-lg font-semibold">IP Singidunum</p>

        <div class="ml-auto">
          <UDropdownMenu :items="profileItems">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-user-round"
              :label="authState?.student?.name || 'Student'"
              aria-label="Profile"
            />
          </UDropdownMenu>
        </div>
      </UContainer>
    </header>

    <UContainer class="py-6">
      <slot />
    </UContainer>
  </div>
</template>
