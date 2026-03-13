<script setup lang="ts">
import type { TestResultRow } from '#shared/types/api'

definePageMeta({
  layout: 'admin',
  title: 'Attempt Review',
})

const route = useRoute()
const { t } = useAppI18n()
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

function compareSubmittedValue(
  studentAnswer: string | null | undefined,
  correctAnswer: string | null | undefined,
  mode: 'ip' | 'text' | 'number' = 'ip',
) {
  if (!correctAnswer) {
    return null
  }

  if (mode === 'number') {
    return Number(studentAnswer || '0') === Number(correctAnswer)
  }

  return (studentAnswer || '').trim() === correctAnswer.trim()
}

function resultFieldClass(isCorrect: boolean | null) {
  if (isCorrect === null) {
    return ''
  }

  return isCorrect ? 'field-correct' : 'field-wrong'
}

function yesNoLabelI18n(value: string | null | undefined) {
  if (value === '1') return t('common.yes')
  if (value === '0') return t('common.no')
  return ''
}

function percentageToneClass(percentage: number | null) {
  if (percentage === null) {
    return 'text-muted'
  }

  if (percentage >= 70) {
    return 'text-green-600 dark:text-green-400'
  }

  if (percentage >= 50) {
    return 'text-amber-600 dark:text-amber-400'
  }

  return 'text-red-600 dark:text-red-400'
}

function statusLabel(status: string) {
  if (status === 'submitted') return 'Submitted'
  if (status === 'in_progress') return 'In progress'
  if (status === 'expired') return 'Expired'
  return status
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
    <div v-if="pageError" class="mx-auto max-w-xl space-y-4">
      <UAlert color="error" variant="soft" title="Unable to load attempt result" :description="pageError" />
      <UButton
        v-if="result"
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        :to="`/admin/tests/${result.testId}`"
      >
        Back to results
      </UButton>
    </div>

    <div v-else-if="result" class="mx-auto max-w-5xl space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-highlighted">{{ result.testTitle }}</h1>
          <p class="mt-1 text-sm text-muted">
            {{ result.studentName }} · {{ statusLabel(result.status) }}
            <span v-if="result.submittedAt"> · {{ new Date(result.submittedAt).toLocaleString() }}</span>
          </p>
        </div>
        <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" :to="`/admin/tests/${result.testId}`">
          Back to results
        </UButton>
      </div>

      <div class="rounded-lg border border-default bg-elevated p-5 mx-3">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted">Attempt result</p>
            <p class="mt-1 text-5xl font-bold" :class="percentageToneClass(result.percentage)">
              {{ result.percentage === null ? '--' : `${result.percentage}%` }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-semibold text-highlighted">
              {{ result.score === null ? '-' : result.score }} / {{ result.totalQuestions }}
            </p>
            <p class="text-sm text-muted">{{ result.studentId }} · Attempt {{ result.attemptNumber }}</p>
          </div>
        </div>
      </div>

      <UCard class="mx-3">
        <div class="grid gap-4 text-sm sm:grid-cols-4">
          <div>
            <p class="text-xs uppercase tracking-[0.12em] text-muted">Status</p>
            <p class="mt-1 text-toned">{{ statusLabel(result.status) }}</p>
          </div>
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

      <UCard variant="subtle" class="mx-3" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level1.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('levels.level1.description') }}</p>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level1.binary') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.yourAnswer') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.correctAnswer') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.sections.level1" :key="row.id" class="border-b border-default last:border-0">
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.binary }}</td>
                <td class="px-4 py-3 text-center">
                  <UInput
                    :model-value="row.studentAnswer || ''"
                    readonly
                    class="w-full"
                    :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'ip'))"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard variant="subtle" class="mx-3" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level2.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('levels.level2.description') }}</p>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level2.ipAddress') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.yourAnswer') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.correctAnswer') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.sections.level2" :key="row.id" class="border-b border-default last:border-0">
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip }}</td>
                <td class="px-4 py-3 text-center">
                  <UInput
                    :model-value="row.studentAnswer || ''"
                    readonly
                    class="w-full"
                    :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'text'))"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard variant="subtle" class="mx-3" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level3.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('levels.level3.description') }}</p>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level3.hostAddress') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level3.networkAddress') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level3.correctNetwork') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level3.broadcastAddress') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level3.correctBroadcast') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.sections.level3" :key="row.id" class="border-b border-default last:border-0">
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.hostIp }}</td>
                <td class="px-4 py-3 text-center">
                  <UInput
                    :model-value="row.studentNetwork || ''"
                    readonly
                    class="w-full"
                    :class="resultFieldClass(compareSubmittedValue(row.studentNetwork, row.correctNetwork, 'ip'))"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                </td>
                <td class="px-4 py-3 text-center">
                  <UInput
                    :model-value="row.studentBroadcast || ''"
                    readonly
                    class="w-full"
                    :class="resultFieldClass(compareSubmittedValue(row.studentBroadcast, row.correctBroadcast, 'ip'))"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard variant="subtle" class="mx-3" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level4.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('levels.level4.description') }}</p>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level4.subnetMask') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.yourAnswer') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.correctAnswer') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.sections.level4" :key="row.id" class="border-b border-default last:border-0">
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                <td class="px-4 py-3 text-center">
                  <UInput
                    :model-value="row.studentAnswer || ''"
                    readonly
                    class="w-full"
                    :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'number'))"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard variant="subtle" class="mx-3" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level5.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('levels.level5.description') }}</p>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level5.address') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.yourAnswer') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.correctAnswer') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.sections.level5" :key="row.id" class="border-b border-default last:border-0">
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.addressCidr }}</td>
                <td class="px-4 py-3 text-center">
                  <UInput
                    :model-value="yesNoLabelI18n(row.studentAnswer)"
                    readonly
                    class="w-full"
                    :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'text'))"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="yesNoLabelI18n(row.correctAnswer)" readonly class="w-full field-correct" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard variant="subtle" class="mx-3" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level6.title') }}</h2>
            <p class="mt-1 text-sm text-muted">{{ t('levels.level6.description') }}</p>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level6.address1') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level6.address2') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level6.subnetMask') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.yourAnswer') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('results.correctAnswer') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.sections.level6" :key="row.id" class="border-b border-default last:border-0">
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip1 }}</td>
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip2 }}</td>
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                <td class="px-4 py-3 text-center">
                  <UInput
                    :model-value="yesNoLabelI18n(row.studentAnswer)"
                    readonly
                    class="w-full"
                    :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'text'))"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="yesNoLabelI18n(row.correctAnswer)" readonly class="w-full field-correct" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard variant="subtle" class="mx-3" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level7.title') }}</h2>
            <p class="mt-1 text-sm text-muted">
              {{ t('levels.level7.description', { network: result.sections.level7.baseNetwork, cidr: result.sections.level7.baseCidr }) }}
            </p>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level7.subnet') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level7.hosts') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level7.networkAddress') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level7.subnetMask') }}</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level7.broadcastAddress') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in result.sections.level7.subnets" :key="row.id">
                <tr class="border-b border-default">
                  <td class="px-4 py-3 text-center font-medium text-toned">{{ row.name }}</td>
                  <td class="px-4 py-3 text-center text-toned">{{ row.hosts }}</td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">{{ t('results.yourNetworkAddress') }}</p>
                    <UInput
                      :model-value="row.studentNetwork || ''"
                      readonly
                      class="w-full"
                      :class="resultFieldClass(compareSubmittedValue(row.studentNetwork, row.correctNetwork, 'ip'))"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">{{ t('results.yourMask') }}</p>
                    <UInput
                      :model-value="row.studentMask || ''"
                      readonly
                      class="w-full"
                      :class="resultFieldClass(compareSubmittedValue(row.studentMask, row.correctMask, 'ip'))"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">{{ t('results.yourBroadcast') }}</p>
                    <UInput
                      :model-value="row.studentBroadcast || ''"
                      readonly
                      class="w-full"
                      :class="resultFieldClass(compareSubmittedValue(row.studentBroadcast, row.correctBroadcast, 'ip'))"
                    />
                  </td>
                </tr>
                <tr class="border-b border-default last:border-0 bg-muted/10">
                  <td class="px-4 py-3 text-center font-medium text-toned">{{ row.name }}</td>
                  <td class="px-4 py-3 text-center text-toned">{{ row.hosts }}</td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">{{ t('results.correctNetworkAddress') }}</p>
                    <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                  </td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">{{ t('results.correctMask') }}</p>
                    <UInput :model-value="row.correctMask || ''" readonly class="w-full field-correct" />
                  </td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">{{ t('results.correctBroadcast') }}</p>
                    <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>

      <div class="flex justify-center pb-10">
        <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" :to="`/admin/tests/${result.testId}`">
          Back to results
        </UButton>
      </div>
    </div>

    <div v-else class="py-10 text-center text-sm text-muted">
      <span v-if="loading">Loading attempt result...</span>
      <span v-else>No attempt result available.</span>
    </div>
  </div>
</template>
