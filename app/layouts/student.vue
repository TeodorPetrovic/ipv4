<script setup lang="ts">
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.student) {
  await navigateTo('/login')
}

const profileItems = computed(() => [[
  {
    label: authState.value?.student?.name || 'Student',
    type: 'label' as const,
  },
  {
    label: authState.value?.student?.studentId || '',
    type: 'label' as const,
  },
], [
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

        <div class="ml-auto flex items-center gap-3">
          <div class="hidden items-center gap-3 rounded-full border border-default px-3 py-1.5 sm:flex">
            <UIcon name="i-lucide-user-round" class="size-4 text-muted" />
            <div class="text-right">
              <p class="text-sm font-medium">{{ authState?.student?.name }}</p>
              <p class="text-xs text-muted">{{ authState?.student?.studentId }}</p>
            </div>
          </div>

          <UDropdownMenu :items="profileItems">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-circle-user-round"
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
