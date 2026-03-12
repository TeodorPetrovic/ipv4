<script setup lang="ts">
const { authState, ensureAuthSession, refreshAuthSession } = useAuthSession()
const colorMode = useColorMode()
const { t } = useAppI18n()

await ensureAuthSession()

if (!authState.value?.student) {
  await navigateTo('/login')
}

const profileItems = computed(() => [[
  {
    label: t('layout.logout'),
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })

      await refreshAuthSession()
      await navigateTo('/login')
    },
  },
]])

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-default bg-default">
      <UContainer class="flex h-16 items-center justify-between gap-4">
        <p class="text-lg font-semibold">IP Singidunum</p>

        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />

          <UDropdownMenu :items="profileItems">
            <UUser
              :name="authState?.student?.name || 'Student'"
              :avatar="{ alt: authState?.student?.name || 'Student' }"
              class="cursor-pointer rounded-md px-2 py-1.5 hover:bg-elevated"
            />
          </UDropdownMenu>

          <UButton
            color="neutral"
            variant="outline"
            :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
            aria-label="Toggle color mode"
            @click="toggleColorMode"
          />
        </div>
      </UContainer>
    </header>

    <UContainer class="py-6">
      <slot />
    </UContainer>
  </div>
</template>
