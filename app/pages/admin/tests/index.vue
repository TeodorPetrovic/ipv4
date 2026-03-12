<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AdminTest, AuthState } from '#shared/types/api'

definePageMeta({
  layout: 'admin',
  title: 'Tests',
})

const tests = ref<AdminTest[]>([])
const globalFilter = ref('')
const pageError = ref('')
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

async function loadTests() {
  try {
    tests.value = await $fetch<AdminTest[]>('/api/tests', {
      headers: requestHeaders,
      query: {
        mode: 'admin',
      },
    })
    pageError.value = ''
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || 'Unable to load tests'
  }
}

if (authState.value?.isAdmin) {
  await loadTests()
}

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

const columns: TableColumn<AdminTest>[] = [
  {
    accessorKey: 'title',
    header: 'Name',
  },
  {
    id: 'startDate',
    header: 'Start date',
  },
  {
    id: 'endDate',
    header: 'End date',
  },
  {
    accessorKey: 'isPublished',
    header: 'Status',
  },
  {
    id: 'action',
    header: '',
  },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <UInput
        v-model="globalFilter"
        placeholder="Search tests"
        icon="i-lucide-search"
        class="w-full sm:max-w-xs"
      />

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" @click="loadTests">
          Refresh
        </UButton>
        <UButton icon="i-lucide-plus" to="/admin/tests/new">
          Create Test
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="pageError"
      color="error"
      variant="soft"
      :title="pageError"
    />

    <div class="table-shell overflow-hidden rounded-lg border border-default">
      <UTable
        v-model:global-filter="globalFilter"
        :data="tests"
        :columns="columns"
        sticky="header"
        empty="No tests found."
      >
        <template #title-cell="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-medium">{{ row.original.title }}</p>
            <UBadge color="neutral" variant="soft">
              {{ row.original.durationMinutes }} min
            </UBadge>
          </div>
        </template>

        <template #startDate-cell="{ row }">
          <span class="text-sm">{{ formatDate(row.original.startAt) }}</span>
        </template>

        <template #endDate-cell="{ row }">
          <span class="text-sm">{{ formatDate(row.original.endAt) }}</span>
        </template>

        <template #isPublished-cell="{ row }">
          <div class="flex items-center">
            <span
              class="inline-block size-3 rounded-full"
              :class="row.original.isInvalid ? 'bg-red-500' : 'bg-emerald-500'"
            />
          </div>
        </template>

        <template #action-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" :to="`/admin/tests/${row.original.id}`">
              Open
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-pencil" :to="`/admin/tests/${row.original.id}/edit`">
              Edit
            </UButton>
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>

