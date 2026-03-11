<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'student',
})

type StudentTest = {
  id: number
  title: string
  description: string | null
  maxAttempts: number
  attemptsUsed: number
  attemptsRemaining: number
  status: string
  activeAttemptId: number | null
  latestScore: number | null
  latestTotalQuestions: number | null
}

const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const loadingActionId = ref<number | null>(null)
const loadingPage = ref(false)
const pageError = ref('')
const tests = ref<StudentTest[]>([])

const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.student) {
  await navigateTo('/login')
}

async function loadTests() {
  loadingPage.value = true

  try {
    tests.value = await $fetch<StudentTest[]>('/api/tests', {
      headers: requestHeaders,
    })
    pageError.value = ''
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || 'Unable to load tests'
  } finally {
    loadingPage.value = false
  }
}

if (authState.value?.student) {
  await loadTests()
}

function statusLabel(status: string) {
  if (status === 'available') return 'Available'
  if (status === 'in_progress') return 'In progress'
  if (status === 'upcoming') return 'Upcoming'
  if (status === 'closed') return 'Closed'
  if (status === 'attempts_exhausted') return 'No attempts left'
  return 'Invalid'
}

function statusColor(status: string) {
  if (status === 'available') return 'success'
  if (status === 'in_progress') return 'primary'
  if (status === 'upcoming') return 'warning'
  if (status === 'closed') return 'neutral'
  if (status === 'attempts_exhausted') return 'error'
  return 'error'
}

function actionLabel(test: StudentTest) {
  return test.status === 'in_progress' ? 'Continue' : 'Start'
}

const columns: TableColumn<StudentTest>[] = [
  {
    accessorKey: 'title',
    header: 'Test',
  },
  {
    id: 'attempts',
    header: 'Attempts',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'action',
    header: '',
  },
]

async function openTest(test: StudentTest) {
  pageError.value = ''
  loadingActionId.value = test.id

  try {
    if (test.activeAttemptId) {
      await navigateTo(`/test/${test.activeAttemptId}`)
      return
    }

    const response = await $fetch<{ attemptId: number }>(`/api/tests/${test.id}/start`, {
      method: 'POST',
    })

    await loadTests()
    await navigateTo(`/test/${response.attemptId}`)
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || 'Unable to open this test'
  } finally {
    loadingActionId.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Tests</h1>
        <p class="text-sm text-muted">Start a test or continue an unfinished attempt.</p>
      </div>

      <UButton color="neutral" variant="outline" :loading="loadingPage" @click="loadTests">
        Refresh
      </UButton>
    </div>

    <UAlert
      v-if="pageError"
      color="error"
      variant="soft"
      :title="pageError"
    />

    <UTable
      :data="tests"
      :columns="columns"
      :loading="loadingPage || loadingActionId !== null"
      sticky="header"
      empty="No tests available."
    >
      <template #title-cell="{ row }">
        <div>
          <p class="font-medium">{{ row.original.title }}</p>
          <p class="text-sm text-muted">{{ row.original.description || 'IPv4 generated question set' }}</p>
        </div>
      </template>

      <template #attempts-cell="{ row }">
        <div class="space-y-1 text-sm">
          <p>{{ row.original.attemptsUsed }} / {{ row.original.maxAttempts }} used</p>
          <p>Remaining: {{ row.original.attemptsRemaining }}</p>
          <p v-if="row.original.latestScore !== null && row.original.latestTotalQuestions !== null">
            Last: {{ row.original.latestScore }} / {{ row.original.latestTotalQuestions }}
          </p>
        </div>
      </template>

      <template #status-cell="{ row }">
        <UBadge :color="statusColor(row.original.status)" variant="subtle">
          {{ statusLabel(row.original.status) }}
        </UBadge>
      </template>

      <template #action-cell="{ row }">
        <UButton
          :loading="loadingActionId === row.original.id"
          :disabled="!['available', 'in_progress'].includes(row.original.status)"
          @click="openTest(row.original)"
        >
          {{ actionLabel(row.original) }}
        </UButton>
      </template>
    </UTable>
  </div>
</template>
