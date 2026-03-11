<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  title: 'Tests',
})

type AdminTest = {
  id: number
  title: string
  description: string | null
  startAt: string | null
  endAt: string | null
  durationMinutes: number
  maxAttempts: number
  isPublished: boolean
  attemptsCount: number
  submissionsCount: number
  isInvalid: boolean
}

const tests = ref<AdminTest[]>([])
const globalFilter = ref('')
const pageError = ref('')
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { data: authState } = await useFetch('/api/auth/session', {
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
    header: 'Test',
  },
  {
    id: 'schedule',
    header: 'Schedule',
  },
  {
    id: 'attempts',
    header: 'Attempts',
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
    <div class="flex items-center justify-between gap-3">
      <UInput
        v-model="globalFilter"
        placeholder="Search tests"
        icon="i-lucide-search"
      />

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" @click="loadTests">
          Refresh
        </UButton>
        <UButton to="/admin/tests/new">
          New Test
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="pageError"
      color="error"
      variant="soft"
      :title="pageError"
    />

    <UTable
      v-model:global-filter="globalFilter"
      :data="tests"
      :columns="columns"
      sticky="header"
      empty="No tests found."
    >
      <template #title-cell="{ row }">
        <div>
          <p class="font-medium">{{ row.original.title }}</p>
          <p class="text-sm text-muted">
            {{ row.original.description || 'No description' }}
          </p>
        </div>
      </template>

      <template #schedule-cell="{ row }">
        <div class="space-y-1 text-sm">
          <p>Start: {{ formatDate(row.original.startAt) }}</p>
          <p>End: {{ formatDate(row.original.endAt) }}</p>
          <p>Duration: {{ row.original.durationMinutes }} min</p>
        </div>
      </template>

      <template #attempts-cell="{ row }">
        <div class="space-y-1 text-sm">
          <p>Max: {{ row.original.maxAttempts }}</p>
          <p>Started: {{ row.original.attemptsCount }}</p>
          <p>Submitted: {{ row.original.submissionsCount }}</p>
        </div>
      </template>

      <template #isPublished-cell="{ row }">
        <UBadge :color="row.original.isInvalid ? 'error' : row.original.isPublished ? 'success' : 'neutral'" variant="subtle">
          {{ row.original.isInvalid ? 'Invalid' : row.original.isPublished ? 'Published' : 'Draft' }}
        </UBadge>
      </template>

      <template #action-cell="{ row }">
        <UButton color="neutral" variant="outline" :to="`/admin/tests/${row.original.id}`">
          Edit
        </UButton>
      </template>
    </UTable>
  </div>
</template>
