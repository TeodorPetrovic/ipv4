<script setup lang="ts">
import type { AuthState } from '#shared/types/api'

const route = useRoute()
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const colorMode = useColorMode()

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
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/admin/settings',
    active: route.path.startsWith('/admin/settings'),
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

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
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
            <UUser
              v-if="!collapsed"
              name="Administrator"
              description="Admin Panel"
              :avatar="{ alt: 'Administrator' }"
              class="w-full cursor-pointer rounded-md px-2 py-1.5 hover:bg-elevated"
            />
            <UButton
              v-else
              color="neutral"
              variant="ghost"
              icon="i-lucide-user-round"
              square
            />
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

          <template #right>
            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="outline"
                :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
                aria-label="Toggle color mode"
                @click="toggleColorMode"
              />
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
