<script setup lang="ts">
import type { StudentAttemptResultsPayload } from '#shared/types/test-attempt'
import { compareSubmittedValue, resultFieldClass } from '~/utils/attempt-results'

definePageMeta({
  layout: 'student',
})

const route = useRoute()
const { t } = useAppI18n()
const attemptId = Number(route.params.attemptId)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

if (!Number.isFinite(attemptId)) {
  await navigateTo('/tests')
}

const { data, error } = await useFetch<StudentAttemptResultsPayload>(
  `/api/tests/attempts/${attemptId}/results`,
  {
    headers: requestHeaders,
  },
)

if ((error.value as any)?.statusCode === 401) {
  await navigateTo('/login', { replace: true })
}

// Component-level translation of yes/no values, since the shared yesNoLabel utility
// returns hardcoded Serbian strings. This version uses the reactive i18n t() function.
function yesNoLabelI18n(value: string | null | undefined): string {
  if (value === '1') return t('common.yes')
  if (value === '0') return t('common.no')
  return ''
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="error" class="mx-auto max-w-xl space-y-4">
      <UAlert
        color="error"
        variant="soft"
        :title="t('results.errors.loadFailed')"
        :description="(error as any)?.data?.message || t('results.errors.unavailable')"
      />
      <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" to="/tests">
        {{ t('common.backToTests') }}
      </UButton>
    </div>

    <div v-else-if="data" class="mx-auto max-w-5xl space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-highlighted">{{ data.attempt.title }}</h1>
          <p class="mt-1 text-sm text-muted">
            {{ data.attempt.status === 'expired' ? t('results.expired') : t('results.submitted') }}
            <span v-if="data.attempt.submittedAt"> · {{ new Date(data.attempt.submittedAt).toLocaleString() }}</span>
          </p>
        </div>
        <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" to="/tests">
          {{ t('common.backToTests') }}
        </UButton>
      </div>

      <div class="rounded-lg border border-default bg-elevated p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted">{{ t('results.yourResult') }}</p>
            <p
              class="mt-1 text-5xl font-bold"
              :class="{
                'text-green-600 dark:text-green-400': data.attempt.percentage >= 70,
                'text-amber-600 dark:text-amber-400': data.attempt.percentage >= 50 && data.attempt.percentage < 70,
                'text-red-600 dark:text-red-400': data.attempt.percentage < 50,
              }"
            >
              {{ data.attempt.percentage }}%
            </p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-semibold text-highlighted">{{ data.attempt.score }} / {{ data.attempt.totalQuestions }}</p>
            <p class="text-sm text-muted">{{ t('results.correctPoints') }}</p>
            <p class="mt-2 text-sm font-medium text-toned">
              {{ data.attempt.percentage >= 70 ? t('results.passed') : data.attempt.percentage >= 50 ? t('results.partial') : t('results.failed') }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-muted/30 p-3">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
                <tr v-for="row in data.sections.level1" :key="row.id" class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.binary }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.studentAnswer || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'ip'))" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <div class="rounded-2xl bg-muted/30 p-3">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
                <tr v-for="row in data.sections.level2" :key="row.id" class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.studentAnswer || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'text'))" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <div class="rounded-2xl bg-muted/30 p-3">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
                <tr v-for="row in data.sections.level3" :key="row.id" class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.hostIp }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.studentNetwork || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentNetwork, row.correctNetwork, 'ip'))" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.studentBroadcast || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentBroadcast, row.correctBroadcast, 'ip'))" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <div class="rounded-2xl bg-muted/30 p-3">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
                <tr v-for="row in data.sections.level4" :key="row.id" class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.studentAnswer || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'number'))" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <div class="rounded-2xl bg-muted/30 p-3">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
                <tr v-for="row in data.sections.level5" :key="row.id" class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.addressCidr }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="yesNoLabelI18n(row.studentAnswer)" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'text'))" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="yesNoLabelI18n(row.correctAnswer)" readonly class="w-full field-correct" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <div class="rounded-2xl bg-muted/30 p-3">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
                <tr v-for="row in data.sections.level6" :key="row.id" class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip1 }}</td>
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip2 }}</td>
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="yesNoLabelI18n(row.studentAnswer)" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'text'))" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput :model-value="yesNoLabelI18n(row.correctAnswer)" readonly class="w-full field-correct" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <div class="rounded-2xl bg-muted/30 p-3">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level7.title') }}</h2>
              <p class="mt-1 text-sm text-muted">
                {{ t('levels.level7.description', { network: data.sections.level7.baseNetwork, cidr: data.sections.level7.baseCidr }) }}
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
                <template v-for="row in data.sections.level7.subnets" :key="row.id">
                  <tr class="border-b border-default">
                    <td class="px-4 py-3 text-center font-medium text-toned">{{ row.name }}</td>
                    <td class="px-4 py-3 text-center text-toned">{{ row.hosts }}</td>
                    <td class="px-4 py-3">
                      <p class="mb-2 text-xs font-medium text-muted">{{ t('results.yourNetworkAddress') }}</p>
                      <UInput :model-value="row.studentNetwork || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentNetwork, row.correctNetwork, 'ip'))" />
                    </td>
                    <td class="px-4 py-3">
                      <p class="mb-2 text-xs font-medium text-muted">{{ t('results.yourMask') }}</p>
                      <UInput :model-value="row.studentMask || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentMask, row.correctMask, 'ip'))" />
                    </td>
                    <td class="px-4 py-3">
                      <p class="mb-2 text-xs font-medium text-muted">{{ t('results.yourBroadcast') }}</p>
                      <UInput :model-value="row.studentBroadcast || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentBroadcast, row.correctBroadcast, 'ip'))" />
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
      </div>

      <div class="flex justify-center pb-10">
        <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" to="/tests">
          {{ t('common.backToTests') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
