<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TestResultRow } from '#shared/types/api'

definePageMeta({
  layout: 'admin',
  title: 'Test Results',
})

const route = useRoute()
const testId = Number(route.params.id)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { authState, ensureAuthSession } = useAuthSession()
await ensureAuthSession()

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

const resultsLoading = ref(false)
const resultsError = ref('')
const testTitle = ref('')
const results = ref<TestResultRow[]>([])

function exportResults() {
  if (import.meta.client) {
    window.location.href = `/api/results/tests/${testId}/export`
  }
}

const columns: TableColumn<TestResultRow>[] = [
  {
    accessorKey: 'studentName',
    header: 'Student',
  },
  {
    accessorKey: 'attemptNumber',
    header: 'Attempt',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'score',
    header: 'Score',
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted',
  },
  {
    id: 'action',
    header: '',
  },
]

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function statusLabel(status: string) {
  if (status === 'submitted') return 'Submitted'
  if (status === 'in_progress') return 'In progress'
  if (status === 'expired') return 'Expired'
  return status
}

function resultColor(result: TestResultRow) {
  if (result.status === 'in_progress') return 'primary'
  if (result.status === 'expired') return 'warning'
  if (result.percentage === null) return 'neutral'
  if (result.percentage >= 70) return 'success'
  if (result.percentage >= 50) return 'warning'
  return 'error'
}

async function loadResults() {
  resultsLoading.value = true

  try {
    const allResults = await $fetch<TestResultRow[]>('/api/results', {
      headers: requestHeaders,
    })
    const filteredResults = allResults.filter(result => result.testId === testId)

    testTitle.value = filteredResults[0]?.testTitle || `Test #${testId}`
    results.value = filteredResults
    resultsError.value = ''
  } catch (requestError: any) {
    resultsError.value = requestError.data?.message || 'Unable to load test results'
  } finally {
    resultsLoading.value = false
  }
}

await loadResults()
</script>

<template>
  <div class="space-y-5">
    <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/admin/tests">
      Back to tests
    </UButton>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">{{ testTitle || `Test #${testId}` }}</h1>
        <p class="text-sm text-muted">Student attempts and scores</p>
      </div>

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" :to="`/admin/tests/${testId}/edit`">
          Edit Test
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide-download" @click="exportResults">
          Export Excel
        </UButton>
        <UButton color="neutral" variant="outline" :loading="resultsLoading" @click="loadResults">
          Refresh Results
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="resultsError"
      color="error"
      variant="soft"
      :title="resultsError"
    />

    <div class="table-shell overflow-hidden rounded-lg border border-default">
      <UTable
        :data="results"
        :columns="columns"
        :loading="resultsLoading"
        sticky="header"
        empty="No students have started this test yet."
      >
        <template #studentName-cell="{ row }">
          <div>
            <p class="font-medium">{{ row.original.studentName }}</p>
            <p class="text-sm text-muted">{{ row.original.studentId }}</p>
          </div>
        </template>

        <template #attemptNumber-cell="{ row }">
          #{{ row.original.attemptNumber }}
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="resultColor(row.original)" variant="subtle">
            {{ statusLabel(row.original.status) }}
          </UBadge>
        </template>

        <template #score-cell="{ row }">
          <div v-if="row.original.score !== null && row.original.percentage !== null" class="flex items-center gap-2">
            <span>{{ row.original.score }} / {{ row.original.totalQuestions }}</span>
            <UBadge :color="resultColor(row.original)" variant="subtle">
              {{ row.original.percentage }}%
            </UBadge>
          </div>
          <span v-else class="text-sm text-muted">Not graded</span>
        </template>

        <template #submittedAt-cell="{ row }">
          {{ formatDate(row.original.submittedAt) }}
        </template>

        <template #action-cell="{ row }">
          <UButton
            color="neutral"
            variant="outline"
            :to="`/admin/results/${row.original.id}`"
          >
            Review
          </UButton>
        </template>
      </UTable>
    </div>
  </div>
</template>
