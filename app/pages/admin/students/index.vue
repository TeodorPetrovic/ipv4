<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AdminStudent, AuthState } from '#shared/types/api'

definePageMeta({
  layout: 'admin',
  title: 'Students',
})

const students = ref<AdminStudent[]>([])
const globalFilter = ref('')
const pageError = ref('')
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

async function loadStudents() {
  try {
    students.value = await $fetch<AdminStudent[]>('/api/students', {
      headers: requestHeaders,
    })
    pageError.value = ''
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || 'Unable to load students'
  }
}

if (authState.value?.isAdmin) {
  await loadStudents()
}

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

const columns: TableColumn<AdminStudent>[] = [
  {
    accessorKey: 'studentId',
    header: 'Student ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
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
        placeholder="Search students"
        icon="i-lucide-search"
        class="w-full sm:max-w-xs"
      />

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" @click="loadStudents">
          Refresh
        </UButton>
        <UButton icon="i-lucide-plus" to="/admin/students/new">
          Create Student
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="pageError"
      color="error"
      variant="soft"
      :title="pageError"
    />

    <div class="table-shell overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <UTable
        v-model:global-filter="globalFilter"
        :data="students"
        :columns="columns"
        sticky="header"
        empty="No students found."
      >
        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
        </template>

        <template #action-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton size="xs" color="neutral" variant="outline" :to="`/admin/students/${row.original.id}`">
              Open
            </UButton>
            <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-pencil" :to="`/admin/students/${row.original.id}`">
              Edit
            </UButton>
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>
