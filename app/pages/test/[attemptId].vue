<script setup lang="ts">
import type { AuthState } from '#shared/types/api'
import type { StudentAttemptPayload } from '#shared/types/test-attempt'

definePageMeta({
  layout: 'student',
})

const route = useRoute()
const toast = useToast()
const attemptId = Number(route.params.attemptId)
const attemptIdParam = String(route.params.attemptId ?? '')
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const classOptions = ['A', 'B', 'C', 'D', 'E']
const networkOptions = [{ label: 'Да', value: '1' }, { label: 'Не', value: '0' }]

const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
  headers: requestHeaders,
})

if (!Number.isFinite(attemptId)) {
  await navigateTo('/tests')
}

if (!authState.value?.student) {
  await navigateTo('/login')
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
    immediate: Boolean(authState.value?.student),
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
    await submitAnswers(true)
  },
})

async function navigateToResults() {
  if (resultsRedirectInFlight.value) {
    return
  }

  resultsRedirectInFlight.value = true
  stopTimer()

  const targetPath = `/results/${attemptIdParam}`

  if (import.meta.client) {
    window.location.replace(targetPath)
    return
  }

  await navigateTo(targetPath, { replace: true })
}

if ((error.value as any)?.statusCode === 401) {
  await navigateTo('/login')
}

if ((error.value as any)?.statusCode === 403) {
  await navigateToResults()
}

const pageError = computed(() => {
  const statusCode = (error.value as any)?.statusCode

  if (!error.value || statusCode === 401 || statusCode === 403) {
    return ''
  }

  return (error.value as any)?.data?.message || 'Није могуће учитати овај покушај.'
})

watch(error, (requestError) => {
  const statusCode = (requestError as any)?.statusCode

  if (statusCode === 403) {
    void navigateToResults()
  } else if (statusCode === 401) {
    void navigateTo('/login')
  }
})

async function submitAnswers(isAutoSubmit = false) {
  if (submitting.value || resultsRedirectInFlight.value) {
    return
  }

  submitting.value = true

  try {
    await $fetch(`/api/tests/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: {
        answers,
        ...(isAutoSubmit ? { autoSubmit: true } : {}),
      },
    })

    await navigateToResults()
  } catch (fetchError: any) {
    if (isAutoSubmit) {
      await navigateToResults()
      return
    }

    toast.add({
      title: 'Грешка при предавању',
      description: fetchError.data?.message || 'Није могуће предати овај покушај.',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="pageError"
      color="error"
      variant="soft"
      :title="pageError"
    />

    <div v-if="data" class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="lg:sticky lg:top-6 lg:self-start">
        <UCard class="bg-muted">
          <template #header>
            <div>
              <h2 class="mt-2 text-lg font-semibold text-highlighted">IP конвертор</h2>
            </div>
          </template>

          <div class="space-y-4">
            <div class="space-y-2">
              <p class="text-sm font-medium text-toned">Децимални у бинарни</p>
              <div class="grid grid-cols-2 gap-2">
                <UInput v-model="decimalOctetInput" class="w-full" />
                <UInput :model-value="decimalToBinaryOutput" class="w-full" readonly />
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-toned">Бинарни у децимални</p>
              <div class="grid grid-cols-2 gap-2">
                <UInput v-model="binaryOctetInput" class="w-full" />
                <UInput :model-value="binaryToDecimalOutput" class="w-full" readonly />
              </div>
            </div>
          </div>
        </UCard>
      </aside>

      <main class="mx-auto w-full max-w-5xl space-y-6">
        <UCard>
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-3">
              <div class="h-full">
                <h1 class="pt-2 text-3xl font-semibold text-highlighted">{{ data.attempt.title }}</h1>
                <p v-if="data.attempt.description" class="mt-2 text-sm text-muted">
                  {{ data.attempt.description }}
                </p>
              </div>
            </div>

            <div class="rounded-lg border border-default bg-elevated px-4 py-3 lg:min-w-56">
              <p class="font-bold uppercase tracking-wide">Преостало време</p>
              <ClientOnly>
                <p class="mt-1 font-mono text-3xl font-bold" :class="remainingTimeColor">{{ remainingTimeLabel }}</p>
                <template #fallback>
                  <p class="mt-1 font-mono text-3xl font-bold text-muted">--:--:--</p>
                </template>
              </ClientOnly>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">Ниво 1 · Превођење из бинарног у децимални облик</h2>
              <p class="mt-1 text-sm text-muted">Претворите бинарну IPv4 адресу у децималну форму.</p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead class="border-b border-default bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Бинарни</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Децимални одговор</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in data.sections.level1"
                  :key="row.id"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.binary }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput
                      v-model="answers.level1[index]"
                      class="w-full"
                      :disabled="submitting"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">Ниво 2 · IPv4 класа</h2>
              <p class="mt-1 text-sm text-muted">Одредите класу сваке IPv4 адресе.</p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead class="border-b border-default bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">IP адреса</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Класа</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in data.sections.level2"
                  :key="row.id"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip }}</td>
                  <td class="px-4 py-3 text-center">
                    <USelect
                      v-model="answers.level2[index]"
                      class="w-full"
                      :items="classOptions"
                      :disabled="submitting"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">Ниво 3 · Мрежна и емисиона адреса</h2>
              <p class="mt-1 text-sm text-muted">Израчунајте мрежну и емисиону адресу за сваки пар хост/CIDR.</p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead class="border-b border-default bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Адреса хоста</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Мрежна адреса</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Емисиона адреса</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in data.sections.level3"
                  :key="row.id"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.hostIp }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput
                      v-model="answers.level3[index]!.network"
                      class="w-full"
                      :disabled="submitting"
                    />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput
                      v-model="answers.level3[index]!.broadcast"
                      class="w-full"
                      :disabled="submitting"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">Ниво 4 · Капацитет мреже</h2>
              <p class="mt-1 text-sm text-muted">Упишите број употребљивих хостова за сваку маску подмреже.</p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead class="border-b border-default bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Маска подмреже</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Употребљиви хостови</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in data.sections.level4"
                  :key="row.id"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput
                      v-model="answers.level4[index]"
                      class="w-full"
                      :disabled="submitting"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">Ниво 5 · Адресе рачунара са јавним Интернет адресама</h2>
              <p class="mt-1 text-sm text-muted">Одредите да ли се дата адреса хоста може користити за јавно Интернет адресирање.</p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead class="border-b border-default bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Адреса</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Употребљива на Интернету?</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in data.sections.level5"
                  :key="row.id"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.addressCidr }}</td>
                  <td class="px-4 py-3 text-center">
                    <USelect
                      v-model="answers.level5[index]"
                      class="w-full"
                      :items="networkOptions"
                      :disabled="submitting"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">Ниво 6 · Локалне и удаљене адресе</h2>
              <p class="mt-1 text-sm text-muted">
                Одредите да ли сваки пар адреса припада истој мрежи.
              </p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead class="border-b border-default bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Адреса 1</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Адреса 2</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Маска подмреже</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Иста мрежа?</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in data.sections.level6"
                  :key="row.id"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip1 }}</td>
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip2 }}</td>
                  <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                  <td class="px-4 py-3 text-center">
                    <USelect
                      v-model="answers.level6[index]"
                      class="w-full"
                      :items="networkOptions"
                      :disabled="submitting"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div>
              <h2 class="text-lg font-semibold text-highlighted">Ниво 7 · Пројекат подмрежавања</h2>
              <p class="mt-1 text-sm text-muted">
                Поделите {{ data.sections.level7.baseNetwork }}/{{ data.sections.level7.baseCidr }} на захтеване величине подмрежа.
              </p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead class="border-b border-default bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Подмрежа</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Хостова</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Мрежна адреса</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Маска подмреже</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Емисиона адреса</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in data.sections.level7.subnets"
                  :key="row.id"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-4 py-3 text-center">
                    <p class="font-medium text-toned">{{ row.name }}</p>
                  </td>
                  <td class="px-4 py-3 text-center text-toned">{{ row.hosts }}</td>
                  <td class="px-4 py-3 text-center">
                    <UInput
                      v-model="answers.level7[index]!.network"
                      class="w-full"
                      :disabled="submitting"
                    />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput
                      v-model="answers.level7[index]!.mask"
                      class="w-full"
                      :disabled="submitting"
                    />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UInput
                      v-model="answers.level7[index]!.broadcast"
                      class="w-full"
                      :disabled="submitting"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <div class="flex flex-col gap-3 pb-10 sm:flex-row sm:justify-center">
          <UButton
            size="xl"
            :loading="submitting"
            @click="submitAnswers()"
          >
            Предај одговоре
          </UButton>
          <UButton size="xl" color="neutral" variant="outline" to="/tests">
            Назад на листу тестова
          </UButton>
        </div>
      </main>
    </div>
  </div>
</template>
