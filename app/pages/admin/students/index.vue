<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  title: 'Students',
})

type AdminStudent = {
  id: number
  studentId: string
  name: string
  createdAt: string | null
  attemptsCount: number
}

const students = ref<AdminStudent[]>([])
const globalFilter = ref('')
const pageError = ref('')
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { data: authState } = await useFetch('/api/auth/session', {
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
    accessorKey: 'attemptsCount',
    header: 'Attempts',
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
        placeholder="Search students"
        icon="i-lucide-search"
      />

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" @click="loadStudents">
          Refresh
        </UButton>
        <UButton to="/admin/students/new">
          New Student
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
      :data="students"
      :columns="columns"
      sticky="header"
      empty="No students found."
    >
      <template #createdAt-cell="{ row }">
        {{ formatDate(row.original.createdAt) }}
      </template>

      <template #action-cell="{ row }">
        <UButton color="neutral" variant="outline" :to="`/admin/students/${row.original.id}`">
          Edit
        </UButton>
      </template>
    </UTable>
  </div>
</template>
