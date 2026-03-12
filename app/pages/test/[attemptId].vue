<script setup lang="ts">
import type { AuthState } from '#shared/types/api'

definePageMeta({
  layout: 'student',
})

type AttemptPayload = {
  attempt: {
    id: number
    testId: number
    title: string
    description: string | null
    status: string
    attemptNumber: number
    startedAt: string | null
    deadlineAt: string | null
    submittedAt: string | null
    score: number
    totalQuestions: number
    percentage: number
    canSubmit: boolean
  }
  sections: {
    level1: Array<{ id: number; binary: string; studentAnswer: string | null; correctAnswer: string | null }>
    level2: Array<{ id: number; ip: string; studentAnswer: string | null; correctAnswer: string | null }>
    level3: Array<{ id: number; hostIp: string; studentNetwork: string | null; studentBroadcast: string | null; correctNetwork: string | null; correctBroadcast: string | null }>
    level4: Array<{ id: number; mask: string; studentAnswer: string | null; correctAnswer: string | null }>
    level5: Array<{ id: number; addressCidr: string; studentAnswer: string | null; correctAnswer: string | null }>
    level6: Array<{ id: number; ip1: string; ip2: string | null; mask: string | null; studentAnswer: string | null; correctAnswer: string | null }>
    level7: {
      baseNetwork: string
      baseCidr: number
      subnets: Array<{
        id: number
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
const attemptId = Number(route.params.attemptId)
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

const submitError = ref('')
const submitting = ref(false)
const decimalOctetInput = ref('')
const binaryOctetInput = ref('')
const answersInitialized = ref(false)
const nowTick = ref(Date.now())
const lastSyncLocalMs = ref(Date.now())
const lastSyncServerMs = ref<number | null>(null)
let countdownTimer: ReturnType<typeof setInterval> | null = null
let serverSyncTimer: ReturnType<typeof setInterval> | null = null

const answers = reactive({
  level1: [] as string[],
  level2: [] as string[],
  level3: [] as Array<{ network: string; broadcast: string }>,
  level4: [] as string[],
  level5: [] as string[],
  level6: [] as string[],
  level7: [] as Array<{ network: string; mask: string; broadcast: string }>,
})

const { data, error, refresh } = await useFetch<AttemptPayload>(
  `/api/tests/attempts/${attemptId}`,
  {
    headers: requestHeaders,
    immediate: Boolean(authState.value?.student),
  },
)

if ((error.value as any)?.statusCode === 401) {
  await navigateTo('/login')
}

function syncAnswers() {
  if (!data.value) {
    return
  }

  if (answersInitialized.value && data.value.attempt.canSubmit) {
    return
  }

  answers.level1 = data.value.sections.level1.map(row => row.studentAnswer || '')
  answers.level2 = data.value.sections.level2.map(row => row.studentAnswer || '')
  answers.level3 = data.value.sections.level3.map(row => ({
    network: row.studentNetwork || '',
    broadcast: row.studentBroadcast || '',
  }))
  answers.level4 = data.value.sections.level4.map(row => row.studentAnswer || '')
  answers.level5 = data.value.sections.level5.map(row => row.studentAnswer || '')
  answers.level6 = data.value.sections.level6.map(row => row.studentAnswer || '')
  answers.level7 = data.value.sections.level7.subnets.map(row => ({
    network: row.studentNetwork || '',
    mask: row.studentMask || '',
    broadcast: row.studentBroadcast || '',
  }))

  answersInitialized.value = true
}

watch(data, syncAnswers, { immediate: true })

const showSolutions = computed(() => Boolean(data.value?.attempt.submittedAt || data.value?.attempt.status === 'expired'))

const estimatedServerNowMs = computed(() => {
  if (lastSyncServerMs.value === null) {
    return nowTick.value
  }

  return lastSyncServerMs.value + (nowTick.value - lastSyncLocalMs.value)
})

const remainingTimeMs = computed(() => {
  const deadlineRaw = data.value?.attempt.deadlineAt

  if (!deadlineRaw || !data.value?.attempt.canSubmit) {
    return 0
  }

  const deadlineMs = new Date(deadlineRaw).getTime()
  return Math.max(0, deadlineMs - estimatedServerNowMs.value)
})

const remainingTimeLabel = computed(() => {
  const totalSeconds = Math.floor(remainingTimeMs.value / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return `${hh}:${mm}:${ss}`
})

const remainingTimeColor = computed(() => {
  if (remainingTimeMs.value <= 60_000) {
    return 'text-red-600'
  }

  if (remainingTimeMs.value <= 5 * 60_000) {
    return 'text-amber-600'
  }

  return 'text-emerald-600'
})

async function syncWithServer() {
  try {
    const [timeResponse] = await Promise.all([
      $fetch<{ now: string }>('/api/time'),
      refresh(),
    ])

    const serverNowMs = new Date(timeResponse.now).getTime()
    if (!Number.isNaN(serverNowMs)) {
      lastSyncServerMs.value = serverNowMs
      lastSyncLocalMs.value = Date.now()
    }
  } catch {
    // Keep the last known server time when sync fails.
  }
}

onMounted(() => {
  countdownTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)

  void syncWithServer()
  serverSyncTimer = setInterval(() => {
    void syncWithServer()
  }, 15000)
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }

  if (serverSyncTimer) {
    clearInterval(serverSyncTimer)
  }
})

function formatDate(value: string | null) {
  if (!value) {
    return 'Није доступно'
  }

  return new Date(value).toLocaleString()
}

function compareValue(studentAnswer: string | null | undefined, correctAnswer: string | null | undefined, mode: 'ip' | 'text' | 'number' = 'ip') {
  if (!correctAnswer) {
    return null
  }

  if (mode === 'number') {
    return Number(studentAnswer || '0') === Number(correctAnswer)
  }

  return (studentAnswer || '').trim() === correctAnswer.trim()
}

function fieldClass(isCorrect: boolean | null) {
  if (!showSolutions.value || isCorrect === null) {
    return ''
  }

  return isCorrect ? 'field-correct' : 'field-wrong'
}

function percentageColor(percentage: number) {
  if (percentage >= 70) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

function decimalToBinary(decimal: number) {
  return decimal.toString(2).padStart(8, '0')
}

function yesNoLabel(val: string | null | undefined) {
  if (val === '1') return 'Да'
  if (val === '0') return 'Не'
  return ''
}

const decimalToBinaryOutput = computed(() => {
  const value = decimalOctetInput.value.trim()
  if (!value) return ''

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
    return 'Невалидна вредност'
  }

  return decimalToBinary(parsed)
})

const binaryToDecimalOutput = computed(() => {
  const value = binaryOctetInput.value.trim()
  if (!value) return ''

  if (!/^[01]{8}$/.test(value)) {
    return 'Невалидна вредност'
  }

  return String(Number.parseInt(value, 2))
})

async function submitAnswers() {
  submitError.value = ''
  submitting.value = true

  try {
    await $fetch(`/api/tests/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: {
        answers,
      },
    })

    await refresh()
  } catch (fetchError: any) {
    submitError.value = fetchError.data?.message || 'Није могуће предати овај покушај'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
      <div v-if="error" class="mx-auto max-w-xl">
        <UAlert
          color="error"
          variant="soft"
          title="Није могуће учитати овај покушај"
          :description="(error as any)?.data?.message || 'Овај покушај није доступан.'"
        />
      </div>

      <div v-else-if="data" class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
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
                  <h1 class="text-3xl my-auto font-semibold text-highlighted pt-2">{{ data.attempt.title }}</h1>
                </div>
              </div>

              <div v-if="data.attempt.canSubmit" class="rounded-lg border border-default bg-elevated px-4 py-3 lg:min-w-56">
                <p class="text font-bold uppercase tracking-wide">Преостало време</p>
                <ClientOnly>
                  <p class="mt-1 font-mono text-3xl font-bold" :class="remainingTimeColor">{{ remainingTimeLabel }}</p>
                  <template #fallback>
                    <p class="mt-1 font-mono text-3xl font-bold text-muted">--:--:--</p>
                  </template>
                </ClientOnly>
              </div>
            </div>
          </UCard>

          <UAlert
            v-if="data.attempt.status === 'expired'"
            color="error"
            variant="soft"
            title="Рок за предају овог покушаја је истекао."
            description="Страница остаје видљива ради прегледа задатака и тачних одговора."
          />

          <UAlert
            v-if="submitError"
            color="error"
            variant="soft"
            :title="submitError"
          />

          <div
            v-if="showSolutions"
            class="rounded-lg border border-default bg-elevated p-5"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Ваш резултат</p>
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
                <p class="text-sm text-muted">тачних поена</p>
                <p class="mt-2 text-sm font-medium text-toned">
                  {{ data.attempt.percentage >= 70 ? 'Тест положен' : data.attempt.percentage >= 50 ? 'Делимично тачно' : 'Тест није положен' }}
                </p>
              </div>
            </div>
          </div>

          <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-highlighted">Ниво 1 · Превођење из бинарног у децимални облик</h2>
                <p class="mt-1 text-sm text-muted">Претворите бинарну IPv4 адресу у децималну форму.</p>
              </div>
            </template>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="border-b border-default bg-muted/30">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Бинарни</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Децимални одговор</th>
                    <th v-if="showSolutions" class="px-4 py-3 text-left text-xs font-semibold text-muted">Тачан одговор</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in data.sections.level1"
                    :key="row.id"
                    class="border-b border-default last:border-0"
                  >
                    <td class="px-4 py-3 font-mono text-toned">{{ row.binary }}</td>
                    <td class="px-4 py-3">
                      <UInput
                        v-model="answers.level1[index]"
                        class="w-full"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level1[index], row.correctAnswer, 'ip'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
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
              <table class="w-full text-sm">
                <thead class="border-b border-default bg-muted/30">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">IP адреса</th>
                    <th class="w-48 px-4 py-3 text-left text-xs font-semibold text-muted">Класа</th>
                    <th v-if="showSolutions" class="w-40 px-4 py-3 text-left text-xs font-semibold text-muted">Тачан одговор</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in data.sections.level2"
                    :key="row.id"
                    class="border-b border-default last:border-0"
                  >
                    <td class="px-4 py-3 font-mono text-toned">{{ row.ip }}</td>
                    <td class="px-4 py-3">
                      <USelect
                        v-model="answers.level2[index]"
                        class="w-full"
                        :items="classOptions"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level2[index], row.correctAnswer, 'text'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
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
              <table class="w-full text-sm">
                <thead class="border-b border-default bg-muted/30">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Адреса хоста</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Мрежна адреса</th>
                    <th v-if="showSolutions" class="px-4 py-3 text-left text-xs font-semibold text-muted">Тачна мрежна</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Емисиона адреса</th>
                    <th v-if="showSolutions" class="px-4 py-3 text-left text-xs font-semibold text-muted">Тачна емисиона</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in data.sections.level3"
                    :key="row.id"
                    class="border-b border-default last:border-0"
                  >
                    <td class="px-4 py-3 font-mono text-toned">{{ row.hostIp }}</td>
                    <td class="px-4 py-3">
                      <UInput
                        v-model="answers.level3[index]!.network"
                        class="w-full"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level3[index]?.network, row.correctNetwork, 'ip'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                    </td>
                    <td class="px-4 py-3">
                      <UInput
                        v-model="answers.level3[index]!.broadcast"
                        class="w-full"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level3[index]?.broadcast, row.correctBroadcast, 'ip'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
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
              <table class="w-full text-sm">
                <thead class="border-b border-default bg-muted/30">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Маска подмреже</th>
                    <th class="w-56 px-4 py-3 text-left text-xs font-semibold text-muted">Употребљиви хостови</th>
                    <th v-if="showSolutions" class="w-48 px-4 py-3 text-left text-xs font-semibold text-muted">Тачан одговор</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in data.sections.level4"
                    :key="row.id"
                    class="border-b border-default last:border-0"
                  >
                    <td class="px-4 py-3 font-mono text-toned">{{ row.mask }}</td>
                    <td class="px-4 py-3">
                      <UInput
                        v-model="answers.level4[index]"
                        class="w-full"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level4[index], row.correctAnswer, 'number'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
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
              <table class="w-full text-sm">
                <thead class="border-b border-default bg-muted/30">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Адреса</th>
                    <th class="w-52 px-4 py-3 text-left text-xs font-semibold text-muted">Употребљива на Интернету?</th>
                    <th v-if="showSolutions" class="w-40 px-4 py-3 text-left text-xs font-semibold text-muted">Тачан одговор</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in data.sections.level5"
                    :key="row.id"
                    class="border-b border-default last:border-0"
                  >
                    <td class="px-4 py-3 font-mono text-toned">{{ row.addressCidr }}</td>
                    <td class="px-4 py-3">
                      <USelect
                        v-model="answers.level5[index]"
                        class="w-full"
                        :items="networkOptions"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level5[index], row.correctAnswer, 'text'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="yesNoLabel(row.correctAnswer)" readonly class="w-full field-correct" />
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
              <table class="w-full text-sm">
                <thead class="border-b border-default bg-muted/30">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Адреса 1</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Адреса 2</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Маска подмреже</th>
                    <th class="w-44 px-4 py-3 text-left text-xs font-semibold text-muted">Иста мрежа?</th>
                    <th v-if="showSolutions" class="w-40 px-4 py-3 text-left text-xs font-semibold text-muted">Тачан одговор</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in data.sections.level6"
                    :key="row.id"
                    class="border-b border-default last:border-0"
                  >
                    <td class="px-4 py-3 font-mono text-toned">{{ row.ip1 }}</td>
                    <td class="px-4 py-3 font-mono text-toned">{{ row.ip2 }}</td>
                    <td class="px-4 py-3 font-mono text-toned">{{ row.mask }}</td>
                    <td class="px-4 py-3">
                      <USelect
                        v-model="answers.level6[index]"
                        class="w-full"
                        :items="networkOptions"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level6[index], row.correctAnswer, 'text'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="yesNoLabel(row.correctAnswer)" readonly class="w-full field-correct" />
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
              <table class="w-full text-sm">
                <thead class="border-b border-default bg-muted/30">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Подмрежа</th>
                    <th class="w-24 px-4 py-3 text-left text-xs font-semibold text-muted">Хостова</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Мрежна адреса</th>
                    <th v-if="showSolutions" class="px-4 py-3 text-left text-xs font-semibold text-muted">Тачна мрежна</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Маска подмреже</th>
                    <th v-if="showSolutions" class="px-4 py-3 text-left text-xs font-semibold text-muted">Тачна маска</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-muted">Емисиона адреса</th>
                    <th v-if="showSolutions" class="px-4 py-3 text-left text-xs font-semibold text-muted">Тачна емисиона</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in data.sections.level7.subnets"
                    :key="row.id"
                    class="border-b border-default last:border-0"
                  >
                    <td class="px-4 py-3">
                      <p class="font-medium text-toned">{{ row.name }}</p>
                    </td>
                    <td class="px-4 py-3 text-toned">{{ row.hosts }}</td>
                    <td class="px-4 py-3">
                      <UInput
                        v-model="answers.level7[index]!.network"
                        class="w-full"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level7[index]?.network, row.correctNetwork, 'ip'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                    </td>
                    <td class="px-4 py-3">
                      <UInput
                        v-model="answers.level7[index]!.mask"
                        class="w-full"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level7[index]?.mask, row.correctMask, 'ip'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="row.correctMask || ''" readonly class="w-full field-correct" />
                    </td>
                    <td class="px-4 py-3">
                      <UInput
                        v-model="answers.level7[index]!.broadcast"
                        class="w-full"
                        :disabled="!data.attempt.canSubmit"
                        :class="fieldClass(compareValue(answers.level7[index]?.broadcast, row.correctBroadcast, 'ip'))"
                      />
                    </td>
                    <td v-if="showSolutions" class="px-4 py-3">
                      <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>

          <div class="flex flex-col gap-3 pb-10 sm:flex-row sm:justify-center">
            <UButton
              v-if="data.attempt.canSubmit"
              size="xl"
              :loading="submitting"
              @click="submitAnswers"
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


