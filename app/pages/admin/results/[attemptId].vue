<script setup lang="ts">
import type { TestResultRow } from '#shared/types/api'

definePageMeta({
  layout: 'admin',
  title: 'Attempt Review',
})

const route = useRoute()
const attemptId = Number(route.params.attemptId)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { authState, ensureAuthSession } = useAuthSession()
await ensureAuthSession()

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

const result = ref<TestResultRow | null>(null)
const loading = ref(false)
const pageError = ref('')

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function yesNoLabel(val: string | null | undefined) {
  if (val === '1') return 'Да'
  if (val === '0') return 'Не'
  return 'Без одговора'
}

function statusLabel(status: string) {
  if (status === 'submitted') return 'Submitted'
  if (status === 'in_progress') return 'In progress'
  if (status === 'expired') return 'Expired'
  return status
}

function percentageColor(percentage: number | null) {
  if (percentage === null) return 'neutral'
  if (percentage >= 70) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

async function loadResult() {
  loading.value = true

  try {
    result.value = await $fetch<TestResultRow>(`/api/results/attempts/${attemptId}`, {
      headers: requestHeaders,
    })
    pageError.value = ''
  } catch (requestError: any) {
    pageError.value = requestError.data?.message || 'Unable to load attempt result'
  } finally {
    loading.value = false
  }
}

await loadResult()
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="pageError"
      color="error"
      variant="soft"
      :title="pageError"
    />

    <template v-else-if="result">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" :to="`/admin/tests/${result.testId}`">
        Back to test results
      </UButton>

      <UCard>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-highlighted">{{ result.studentName }} · Attempt {{ result.attemptNumber }}</h1>
            <p class="mt-1 text-sm text-muted">{{ result.studentId }} · {{ result.testTitle }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UBadge :color="percentageColor(result.percentage)" variant="soft">
              {{ statusLabel(result.status) }}
            </UBadge>
            <UBadge v-if="result.percentage !== null" :color="percentageColor(result.percentage)" variant="soft">
              {{ result.percentage }}%
            </UBadge>
            <UBadge v-if="result.score !== null" color="neutral" variant="soft">
              {{ result.score }} / {{ result.totalQuestions }}
            </UBadge>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p class="text-xs uppercase tracking-[0.12em] text-muted">Started</p>
            <p class="mt-1 text-toned">{{ formatDate(result.startedAt) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.12em] text-muted">Deadline</p>
            <p class="mt-1 text-toned">{{ formatDate(result.deadlineAt) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.12em] text-muted">Submitted</p>
            <p class="mt-1 text-toned">{{ formatDate(result.submittedAt) }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Ниво 1</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div v-for="(row, index) in result.sections.level1" :key="`l1-${index}`" class="rounded-xl border border-default p-3">
            <p class="font-mono">{{ row.binary }}</p>
            <p>Студент: <span class="font-mono">{{ row.studentAnswer || 'Без одговора' }}</span></p>
            <p>Тачно: <span class="font-mono">{{ row.correctAnswer }}</span></p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Ниво 2</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div v-for="(row, index) in result.sections.level2" :key="`l2-${index}`" class="rounded-xl border border-default p-3">
            <p class="font-mono">{{ row.ip }}</p>
            <p>Студент: {{ row.studentAnswer || 'Без одговора' }}</p>
            <p>Тачно: {{ row.correctAnswer }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Ниво 3</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div v-for="(row, index) in result.sections.level3" :key="`l3-${index}`" class="rounded-xl border border-default p-3">
            <p class="font-mono">{{ row.hostIp }}</p>
            <p>Мрежа студ.: <span class="font-mono">{{ row.studentNetwork || 'Без одговора' }}</span></p>
            <p>Тачна мрежа: <span class="font-mono">{{ row.correctNetwork }}</span></p>
            <p>Емисија студ.: <span class="font-mono">{{ row.studentBroadcast || 'Без одговора' }}</span></p>
            <p>Тачна емисија: <span class="font-mono">{{ row.correctBroadcast }}</span></p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Ниво 4</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div v-for="(row, index) in result.sections.level4" :key="`l4-${index}`" class="rounded-xl border border-default p-3">
            <p class="font-mono">{{ row.mask }}</p>
            <p>Студент: {{ row.studentAnswer || 'Без одговора' }}</p>
            <p>Тачно: {{ row.correctAnswer }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Ниво 5</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div v-for="(row, index) in result.sections.level5" :key="`l5-${index}`" class="rounded-xl border border-default p-3">
            <p class="font-mono">{{ row.addressCidr }}</p>
            <p>Студент: {{ yesNoLabel(row.studentAnswer) }}</p>
            <p>Тачно: {{ yesNoLabel(row.correctAnswer) }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Ниво 6</h2>
        </template>
        <div class="space-y-3 text-sm">
          <div v-for="(row, index) in result.sections.level6" :key="`l6-${index}`" class="rounded-xl border border-default p-3">
            <p class="font-mono">{{ row.ip1 }} · {{ row.ip2 }} · {{ row.mask }}</p>
            <p>Студент: {{ yesNoLabel(row.studentAnswer) }}</p>
            <p>Тачно: {{ yesNoLabel(row.correctAnswer) }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Ниво 7</h2>
        </template>
        <div class="space-y-3 text-sm">
          <p class="text-muted">Базна мрежа: {{ result.sections.level7.baseNetwork }}/{{ result.sections.level7.baseCidr }}</p>
          <div v-for="(row, index) in result.sections.level7.subnets" :key="`l7-${index}`" class="rounded-xl border border-default p-3">
            <p>{{ row.name }} · {{ row.hosts }} хостова</p>
            <p>Мрежа студ.: <span class="font-mono">{{ row.studentNetwork || 'Без одговора' }}</span></p>
            <p>Тачна мрежа: <span class="font-mono">{{ row.correctNetwork }}</span></p>
            <p>Маска студ.: <span class="font-mono">{{ row.studentMask || 'Без одговора' }}</span></p>
            <p>Тачна маска: <span class="font-mono">{{ row.correctMask }}</span></p>
            <p>Емисија студ.: <span class="font-mono">{{ row.studentBroadcast || 'Без одговора' }}</span></p>
            <p>Тачна емисија: <span class="font-mono">{{ row.correctBroadcast }}</span></p>
          </div>
        </div>
      </UCard>

      <div class="pb-4">
        <UButton color="neutral" variant="outline" :to="`/admin/tests/${result.testId}`">
          Back to Results
        </UButton>
      </div>
    </template>

    <div v-else class="py-10 text-center text-sm text-muted">
      <span v-if="loading">Loading attempt result...</span>
      <span v-else>No attempt result available.</span>
    </div>
  </div>
</template>
