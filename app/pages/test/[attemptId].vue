<script setup lang="ts">
import type { StudentAttemptPayload } from '#shared/types/test-attempt'

definePageMeta({
  layout: 'student',
})

const route = useRoute()
const toast = useToast()
const { t } = useAppI18n()
const attemptId = Number(route.params.attemptId)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const classOptions = ['A', 'B', 'C', 'D', 'E']
const networkOptions = computed(() => [
  { label: t('common.yes'), value: '1' },
  { label: t('common.no'), value: '0' },
])

if (!Number.isFinite(attemptId)) {
  await navigateTo('/tests')
}

const submitting = ref(false)
const resultsRedirectInFlight = ref(false)

const {
  decimalOctetInput,
  decimalToBinaryOutput,
  binaryOctetInput,
  binaryToDecimalOutput,
} = useIpOctetConverter()

const { data, error } = await useFetch<StudentAttemptPayload>(
  `/api/tests/attempts/${attemptId}`,
  {
    headers: requestHeaders,
  },
)

const { answers } = useAttemptAnswers(data)

const {
  remainingTimeLabel,
  remainingTimeColor,
  stop: stopTimer,
} = useAttemptTimer({
  deadlineAt: computed(() => data.value?.attempt.deadlineAt ?? null),
  canSubmit: computed(() => Boolean(data.value?.attempt.canSubmit)),
  onExpired: async () => {
    await submitAnswers()
  },
})

async function navigateToResults() {
  if (resultsRedirectInFlight.value) {
    return
  }

  resultsRedirectInFlight.value = true
  stopTimer()

  await navigateTo(`/results/${attemptId}`, { replace: true })
}

async function handleAttemptLoadError(requestError: any) {
  const statusCode = requestError?.statusCode

  if (statusCode === 401) {
    await navigateTo('/login', { replace: true })
    return
  }

  if (statusCode === 403) {
    await navigateToResults()
  }
}

await handleAttemptLoadError(error.value)

const pageError = computed(() => {
  const statusCode = (error.value as any)?.statusCode

  if (!error.value || statusCode === 401 || statusCode === 403) {
    return ''
  }

  return (error.value as any)?.data?.message || t('test.errors.loadFailed')
})

watch(error, (requestError) => {
  void handleAttemptLoadError(requestError)
})

async function submitAnswers() {
  if (submitting.value || resultsRedirectInFlight.value) {
    return
  }

  submitting.value = true

  try {
    await $fetch(`/api/tests/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: {
        answers,
      },
    })

    await navigateToResults()
  } catch (fetchError: any) {
    toast.add({
      title: t('test.errors.submitTitle'),
      description: fetchError.data?.message || t('test.errors.submitFailed'),
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UAlert v-if="pageError" color="error" variant="soft" :title="pageError" />

    <div v-if="data" class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="lg:sticky lg:top-6 lg:self-start space-y-4">
        <UCard variant="subtle" class="bg-muted">
          <template #header>
            <div>
              <h2 class="mt-2 text-lg text-center font-semibold text-highlighted">{{ t('ipConverter.title') }}</h2>
            </div>
          </template>

          <div class="space-y-4">
            <div class="space-y-2">
              <p class="text-sm font-medium text-toned">{{ t('ipConverter.decimalToBinary') }}</p>
              <div class="grid grid-cols-2 gap-2">
                <UInput v-model="decimalOctetInput" class="w-full" />
                <UInput :model-value="decimalToBinaryOutput" class="w-full" readonly />
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-toned">{{ t('ipConverter.binaryToDecimal') }}</p>
              <div class="grid grid-cols-2 gap-2">
                <UInput v-model="binaryOctetInput" class="w-full" />
                <UInput :model-value="binaryToDecimalOutput" class="w-full" readonly />
              </div>
            </div>
          </div>
        </UCard>

        <div class="rounded-lg border border-default bg-elevated px-4 py-3">
          <p class="font-bold text-center uppercase tracking-wide">{{ t('timer.remainingTime') }}</p>
          <ClientOnly>
            <p class="mt-1 font-mono text-3xl font-bold text-center" :class="remainingTimeColor">{{ remainingTimeLabel }}</p>
            <template #fallback>
              <p class="mt-1 font-mono text-3xl font-bold text-center text-muted">--:--:--</p>
            </template>
          </ClientOnly>
        </div>
      </aside>

      <main class="mx-auto w-full max-w-5xl space-y-6">
        <UCard variant="subtle" >
          <div class="space-y-3">
            <h1 class="pt-2 text-3xl font-semibold text-highlighted">{{ data.attempt.title }}</h1>
            <p v-if="data.attempt.description" class="text-sm text-muted">
              {{ data.attempt.description }}
            </p>
          </div>
        </UCard>

        <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
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
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level1.binary') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level1.decimalAnswer')
                    }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in data.sections.level1" :key="row.id"
                  class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.binary }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput v-model="answers.level1[index]" class="w-full" :disabled="submitting" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
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
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level2.ipAddress') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level2.class') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in data.sections.level2" :key="row.id"
                  class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip }}</td>
                  <td class="px-4 py-3 text-center">
                    <USelect v-model="answers.level2[index]" class="w-full" :items="classOptions"
                      :disabled="submitting" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
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
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level3.hostAddress')
                    }}</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{
                    t('levels.level3.networkAddress') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{
                    t('levels.level3.broadcastAddress') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in data.sections.level3" :key="row.id"
                  class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.hostIp }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput v-model="answers.level3[index]!.network" class="w-full" :disabled="submitting" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput v-model="answers.level3[index]!.broadcast" class="w-full" :disabled="submitting" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
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
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level4.subnetMask') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level4.usableHosts')
                    }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in data.sections.level4" :key="row.id"
                  class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput v-model="answers.level4[index]" class="w-full" :disabled="submitting" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
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
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level5.address') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{
                    t('levels.level5.usableOnInternet') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in data.sections.level5" :key="row.id"
                  class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.addressCidr }}</td>
                  <td class="px-4 py-3 text-center">
                    <USelect v-model="answers.level5[index]" class="w-full" :items="networkOptions"
                      :disabled="submitting" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
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
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level6.address1') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level6.address2') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level6.subnetMask') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level6.sameNetwork')
                    }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in data.sections.level6" :key="row.id"
                  class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip1 }}</td>
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip2 }}</td>
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                  <td class="px-4 py-3 text-center">
                    <USelect v-model="answers.level6[index]" class="w-full" :items="networkOptions"
                      :disabled="submitting" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">{{ t('levels.level7.title') }}</h2>
              <p class="mt-1 text-sm text-muted">
                {{ t('levels.level7.description', {
                  network: data.sections.level7.baseNetwork, cidr:
                    data.sections.level7.baseCidr }) }}
              </p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead class="border-b border-default bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level7.subnet') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level7.hosts') }}</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{
                    t('levels.level7.networkAddress') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{ t('levels.level7.subnetMask') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">{{
                    t('levels.level7.broadcastAddress') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in data.sections.level7.subnets" :key="row.id"
                  class="border-b border-default last:border-0">
                  <td class="px-4 py-3 text-center">
                    <p class="font-medium text-toned">{{ row.name }}</p>
                  </td>
                  <td class="px-4 py-3 text-center text-toned">{{ row.hosts }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput v-model="answers.level7[index]!.network" class="w-full" :disabled="submitting" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput v-model="answers.level7[index]!.mask" class="w-full" :disabled="submitting" />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput v-model="answers.level7[index]!.broadcast" class="w-full" :disabled="submitting" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <div class="flex flex-col gap-3 pb-10 sm:flex-row sm:justify-center">
          <UButton size="xl" :loading="submitting" @click="submitAnswers()">
            {{ t('common.submitAnswers') }}
          </UButton>
          <UButton size="xl" color="neutral" variant="outline" to="/tests">
            {{ t('common.backToTests') }}
          </UButton>
        </div>
      </main>
    </div>
  </div>
</template>
