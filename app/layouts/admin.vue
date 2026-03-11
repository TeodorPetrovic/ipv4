<script setup lang="ts">
const route = useRoute()
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

const navigationItems = computed(() => [
  {
    label: 'Tests',
    icon: 'i-lucide-file-text',
    to: '/admin/tests',
    active: route.path.startsWith('/admin/tests'),
  },
  {
    label: 'Students',
    icon: 'i-lucide-users',
    to: '/admin/students',
    active: route.path.startsWith('/admin/students'),
  },
])

const pageTitle = computed(() => {
  return (route.meta.title as string) || 'Admin'
})

async function logout() {
  await $fetch('/api/auth/logout', {
    method: 'POST',
  })

  await navigateTo('/admin')
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <div class="px-2">
          <p class="font-semibold">IPv4 Admin</p>
          <p class="text-sm text-muted">Tests and students</p>
        </div>
      </template>

      <div class="flex flex-col gap-1 p-2">
        <UButton
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          color="neutral"
          :variant="item.active ? 'soft' : 'ghost'"
          class="justify-start"
        >
          {{ item.label }}
        </UButton>
      </div>

      <template #footer>
        <div class="p-2">
          <UButton
            block
            color="neutral"
            variant="ghost"
            icon="i-lucide-log-out"
            class="justify-start"
            @click="logout"
          >
            Logout
          </UButton>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :title="pageTitle" />
      </template>

      <template #body>
        <div class="p-4 lg:p-6">
          <slot />
        </div>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
