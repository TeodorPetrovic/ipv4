<script setup lang="ts">
import type { AuthState } from '#shared/types/api'

const route = useRoute()
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
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

const profileMenuItems = computed(() => [[
  {
    label: 'Admin Panel',
    icon: 'i-lucide-shield-check',
    disabled: true,
  },
], [
  {
    label: 'Logout',
    icon: 'i-lucide-log-out',
    onSelect: logout,
  },
]])

async function logout() {
  await $fetch('/api/auth/logout', {
    method: 'POST',
  })

  await navigateTo('/admin')
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      resizable
      collapsible
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex w-full items-center gap-2 pt-2 justify-center">
          <UIcon name="i-lucide-network" class="size-5 shrink-0 text-primary" />
          <div v-if="!collapsed" class="min-w-0">
            <p class="truncate font-semibold text-highlighted">IPv4 Admin</p>
            <p class="truncate text-xs text-muted">Tests and students</p>
          </div>
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-1">
          <UButton
            v-for="item in navigationItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            color="neutral"
            :variant="item.active ? 'soft' : 'ghost'"
            class="justify-start"
            :label="collapsed ? undefined : item.label"
            :square="collapsed"
          />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <div class="w-full">
          <UDropdownMenu :items="profileMenuItems" :content="{ side: 'top', align: 'start' }">
            <UButton
              block
              color="neutral"
              variant="ghost"
              class="justify-start"
              :label="collapsed ? undefined : 'Administrator'"
              icon="i-lucide-user-round"
              :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
              :square="collapsed"
            >
              <template #leading>
                <UAvatar icon="i-lucide-user-round" size="sm" />
              </template>
            </UButton>
          </UDropdownMenu>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar >
          <template #left>
            <div class="flex items-center gap-2">
              <UDashboardSidebarCollapse variant="ghost" />
              <span class="font-semibold text-highlighted">{{ pageTitle }}</span>
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-4 lg:p-6">
          <slot />
        </div>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
