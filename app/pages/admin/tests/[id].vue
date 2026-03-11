<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  title: 'Test Details',
})

type TestResultRow = {
  id: number
  studentName: string
  studentId: string
  testTitle: string
  status: string
  attemptNumber: number
  score: number | null
  totalQuestions: number
  percentage: number | null
  submittedAt: string | null
  startedAt: string | null
  deadlineAt: string | null
  sections: {
    level1: Array<{ binary: string; studentAnswer: string | null; correctAnswer: string | null }>
    level2: Array<{ ip: string; studentAnswer: string | null; correctAnswer: string | null }>
    level3: Array<{ hostIp: string; studentNetwork: string | null; studentBroadcast: string | null; correctNetwork: string | null; correctBroadcast: string | null }>
    level4: Array<{ mask: string; studentAnswer: string | null; correctAnswer: string | null }>
    level5: Array<{ ip1: string; ip2: string | null; mask: string | null; studentAnswer: string | null; correctAnswer: string | null }>
    level6: {
      baseNetwork: string
      baseCidr: number
      subnets: Array<{
        name: string
        hosts: number
        studentNetwork: string | null
        studentMask: string | null
        studentBroadcast: string | null
        correctNetwork: string | null
        correctMask: string | null
        correctBroadcast: string | null
      }>
    }
  }
}

const route = useRoute()
const testId = Number(route.params.id)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

const loading = ref(false)
const error = ref('')
const resultsLoading = ref(false)
const resultsError = ref('')
const selectedAttemptId = ref<number | null>(null)
const results = ref<TestResultRow[]>([])

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

const form = reactive({
  title: '',
  description: '',
  startAt: '',
  endAt: '',
  durationMinutes: 60,
  maxAttempts: 1,
  isPublished: true,
})

function toInputValue(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const { data, error: fetchError } = await useFetch<{
  title: string
  description: string | null
  startAt: string | null
  endAt: string | null
  durationMinutes: number
  maxAttempts: number
  isPublished: boolean
}>(`/api/tests/${testId}`, {
  headers: requestHeaders,
  immediate: Boolean(authState.value?.isAdmin),
})

watchEffect(() => {
  if (!data.value) {
    return
  }

  form.title = data.value.title
  form.description = data.value.description || ''
  form.startAt = toInputValue(data.value.startAt)
  form.endAt = toInputValue(data.value.endAt)
  form.durationMinutes = data.value.durationMinutes
  form.maxAttempts = data.value.maxAttempts
  form.isPublished = data.value.isPublished
})

if (fetchError.value) {
  error.value = (fetchError.value as any).data?.message || 'Unable to load test'
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

async function loadResults() {
  resultsLoading.value = true

  try {
    const response = await $fetch<{ results: TestResultRow[] }>(`/api/tests/${testId}/results`, {
      headers: requestHeaders,
    })

    results.value = response.results

    if (selectedAttemptId.value && !response.results.some(result => result.id === selectedAttemptId.value)) {
      selectedAttemptId.value = null
    }

    resultsError.value = ''
  } catch (requestError: any) {
    resultsError.value = requestError.data?.message || 'Unable to load test results'
  } finally {
    resultsLoading.value = false
  }
}

if (authState.value?.isAdmin) {
  await loadResults()
}

const selectedResult = computed(() => {
  return results.value.find(result => result.id === selectedAttemptId.value) || null
})

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

async function save() {
  error.value = ''
  loading.value = true

  try {
    await $fetch(`/api/tests/${testId}`, {
      method: 'POST',
      body: form,
    })

    await navigateTo('/admin/tests')
  } catch (requestError: any) {
    error.value = requestError.data?.message || 'Unable to update test'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h1 class="text-lg font-semibold">Basic Information</h1>
            <p class="text-sm text-muted">Edit the test name and internal description.</p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Title" required>
            <UInput v-model="form.title" class="w-full" placeholder="IPv4 Midterm A" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="form.description" class="w-full" :rows="6" placeholder="Optional description" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h1 class="text-lg font-semibold">Availability</h1>
            <p class="text-sm text-muted">Adjust schedule, duration, attempts, and publication state.</p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Start date" required>
            <UInput v-model="form.startAt" class="w-full" type="datetime-local" />
          </UFormField>

          <UFormField label="End date" required>
            <UInput v-model="form.endAt" class="w-full" type="datetime-local" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Duration (minutes)" required>
              <UInput v-model="form.durationMinutes" class="w-full" type="number" min="1" />
            </UFormField>

            <UFormField label="Max attempts" required>
              <UInput v-model="form.maxAttempts" class="w-full" type="number" min="1" />
            </UFormField>
          </div>

          <div class="rounded-lg border border-default p-4">
            <UFormField label="Published">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-medium">Visible to students</p>
                  <p class="text-xs text-muted">Students can only open published tests.</p>
                </div>

                <USwitch v-model="form.isPublished" />
              </div>
            </UFormField>
          </div>
        </div>
      </UCard>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
    />

    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" to="/admin/tests">
        Cancel
      </UButton>
      <UButton :loading="loading" @click="save">
        Save Changes
      </UButton>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">Test Results</h2>
            <p class="text-sm text-muted">Students who started this test appear here with their status and score.</p>
          </div>

          <UButton color="neutral" variant="outline" :loading="resultsLoading" @click="loadResults">
            Refresh Results
          </UButton>
        </div>
      </template>

      <div class="space-y-4">
        <UAlert
          v-if="resultsError"
          color="error"
          variant="soft"
          :title="resultsError"
        />

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
              @click="selectedAttemptId = selectedAttemptId === row.original.id ? null : row.original.id"
            >
              {{ selectedAttemptId === row.original.id ? 'Hide' : 'Review' }}
            </UButton>
          </template>
        </UTable>
      </div>
    </UCard>

    <UCard v-if="selectedResult">
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold">{{ selectedResult.studentName }} · Attempt {{ selectedResult.attemptNumber }}</h2>
          <p class="text-sm text-muted">
            Status: {{ statusLabel(selectedResult.status) }} · Submitted {{ formatDate(selectedResult.submittedAt) }}
          </p>
        </div>
      </template>

      <div class="space-y-6 text-sm">
        <section>
          <p class="font-medium">Timing</p>
          <p class="text-muted">Started: {{ formatDate(selectedResult.startedAt) }}</p>
          <p class="text-muted">Deadline: {{ formatDate(selectedResult.deadlineAt) }}</p>
        </section>

        <section>
          <p class="font-medium">Level 1</p>
          <div v-for="(row, index) in selectedResult.sections.level1" :key="`l1-${index}`" class="mt-2 space-y-1">
            <p class="font-mono">{{ row.binary }}</p>
            <p>Student: <span class="font-mono">{{ row.studentAnswer || 'No answer' }}</span></p>
            <p>Correct: <span class="font-mono">{{ row.correctAnswer }}</span></p>
          </div>
        </section>

        <section>
          <p class="font-medium">Level 2</p>
          <div v-for="(row, index) in selectedResult.sections.level2" :key="`l2-${index}`" class="mt-2 space-y-1">
            <p class="font-mono">{{ row.ip }}</p>
            <p>Student: {{ row.studentAnswer || 'No answer' }}</p>
            <p>Correct: {{ row.correctAnswer }}</p>
          </div>
        </section>

        <section>
          <p class="font-medium">Level 3</p>
          <div v-for="(row, index) in selectedResult.sections.level3" :key="`l3-${index}`" class="mt-2 space-y-1">
            <p class="font-mono">{{ row.hostIp }}</p>
            <p>Student network: <span class="font-mono">{{ row.studentNetwork || 'No answer' }}</span></p>
            <p>Correct network: <span class="font-mono">{{ row.correctNetwork }}</span></p>
            <p>Student broadcast: <span class="font-mono">{{ row.studentBroadcast || 'No answer' }}</span></p>
            <p>Correct broadcast: <span class="font-mono">{{ row.correctBroadcast }}</span></p>
          </div>
        </section>

        <section>
          <p class="font-medium">Level 4</p>
          <div v-for="(row, index) in selectedResult.sections.level4" :key="`l4-${index}`" class="mt-2 space-y-1">
            <p class="font-mono">{{ row.mask }}</p>
            <p>Student: {{ row.studentAnswer || 'No answer' }}</p>
            <p>Correct: {{ row.correctAnswer }}</p>
          </div>
        </section>

        <section>
          <p class="font-medium">Level 5</p>
          <div v-for="(row, index) in selectedResult.sections.level5" :key="`l5-${index}`" class="mt-2 space-y-1">
            <p class="font-mono">{{ row.ip1 }} · {{ row.ip2 }} · {{ row.mask }}</p>
            <p>Student: {{ row.studentAnswer || 'No answer' }}</p>
            <p>Correct: {{ row.correctAnswer }}</p>
          </div>
        </section>

        <section>
          <p class="font-medium">Level 6</p>
          <p class="text-muted">Base network: {{ selectedResult.sections.level6.baseNetwork }}/{{ selectedResult.sections.level6.baseCidr }}</p>
          <div v-for="(row, index) in selectedResult.sections.level6.subnets" :key="`l6-${index}`" class="mt-2 space-y-1">
            <p>{{ row.name }} · {{ row.hosts }} hosts</p>
            <p>Student network: <span class="font-mono">{{ row.studentNetwork || 'No answer' }}</span></p>
            <p>Correct network: <span class="font-mono">{{ row.correctNetwork }}</span></p>
            <p>Student mask: <span class="font-mono">{{ row.studentMask || 'No answer' }}</span></p>
            <p>Correct mask: <span class="font-mono">{{ row.correctMask }}</span></p>
            <p>Student broadcast: <span class="font-mono">{{ row.studentBroadcast || 'No answer' }}</span></p>
            <p>Correct broadcast: <span class="font-mono">{{ row.correctBroadcast }}</span></p>
          </div>
        </section>
      </div>
    </UCard>
  </div>
</template>
