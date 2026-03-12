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
}

watch(data, syncAnswers, { immediate: true })

const showSolutions = computed(() => Boolean(data.value?.attempt.submittedAt || data.value?.attempt.status === 'expired'))

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

    await navigateTo('/tests')
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
          <UCard>
            <template #header>
              <div>
                <h2 class="mt-2 text-lg font-semibold text-slate-950">IP конвертор</h2>
              </div>
            </template>

            <div class="space-y-4">
              <div class="space-y-2">
                <p class="text-sm font-medium text-slate-800">Децимални у бинарни</p>
                <div class="grid grid-cols-2 gap-2">
                  <UInput v-model="decimalOctetInput" class="w-full" />
                  <UInput :model-value="decimalToBinaryOutput" class="w-full" readonly />
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium text-slate-800">Бинарни у децимални</p>
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
                <div>
                  <h1 class="text-3xl font-semibold text-slate-950">{{ data.attempt.title }}</h1>
                </div>
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

          <UAlert
            v-if="showSolutions"
            :color="percentageColor(data.attempt.percentage)"
            variant="soft"
            :title="`Резултат: ${data.attempt.percentage}%`"
            :description="`${data.attempt.score} / ${data.attempt.totalQuestions} тачних поена`"
          />

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Ниво 1 · Превођење из бинарног у децимални облик</h2>
                <p class="mt-1 text-sm text-slate-500">Претворите бинарну IPv4 адресу у децималну форму.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level1"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_1fr]"
              >
                <div>
                  <p class="text-xs font-medium uppercase text-slate-500">Бинарни</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.binary }}</p>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase text-slate-500">Децимални одговор</p>
                  <UInput
                    v-model="answers.level1[index]"
                    class="w-full"
                    :disabled="!data.attempt.canSubmit"
                    :class="fieldClass(compareValue(answers.level1[index], row.correctAnswer, 'ip'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase text-slate-500">Тачан одговор</p>
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Ниво 2 · IPv4 класа</h2>
                <p class="mt-1 text-sm text-slate-500">Одредите класу сваке IPv4 адресе.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level2"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_220px]"
              >
                <div>
                  <p class="text-xs font-medium uppercase  text-slate-500">IP адреса</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.ip }}</p>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase text-slate-500">Класа</p>
                  <USelect
                    v-model="answers.level2[index]"
                    class="w-full"
                    :items="classOptions"
                    :disabled="!data.attempt.canSubmit"
                    :class="fieldClass(compareValue(answers.level2[index], row.correctAnswer, 'text'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase text-slate-500">Тачан одговор</p>
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Ниво 3 · Мрежна и емисиона адреса</h2>
                <p class="mt-1 text-sm text-slate-500">Израчунајте мрежну и емисиону адресу за сваки пар хост/CIDR.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level3"
                :key="row.id"
                class="grid gap-4 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_1fr_1fr]"
              >
                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase  text-slate-500">Адреса хоста</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.hostIp }}</p>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase  text-slate-500">Мрежна адреса</p>
                  <UInput
                    v-model="answers.level3[index]!.network"
                    class="w-full"
                    :disabled="!data.attempt.canSubmit"
                    :class="fieldClass(compareValue(answers.level3[index]?.network, row.correctNetwork, 'ip'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase text-slate-500">Тачан одговор</p>
                    <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase  text-slate-500">Емисиона адреса</p>
                  <UInput
                    v-model="answers.level3[index]!.broadcast"
                    class="w-full"
                    :disabled="!data.attempt.canSubmit"
                    :class="fieldClass(compareValue(answers.level3[index]?.broadcast, row.correctBroadcast, 'ip'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase text-slate-500">Тачан одговор</p>
                    <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Ниво 4 · Капацитет мреже</h2>
                <p class="mt-1 text-sm text-slate-500">Упишите број употребљивих хостова за сваку маску подмреже.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level4"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_240px]"
              >
                <div>
                  <p class="text-xs font-medium uppercase text-slate-500">Маска подмреже</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.mask }}</p>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase text-slate-500">Употребљиви хостови</p>
                  <UInput
                    v-model="answers.level4[index]"
                    class="w-full"
                    :disabled="!data.attempt.canSubmit"
                    :class="fieldClass(compareValue(answers.level4[index], row.correctAnswer, 'number'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase text-slate-500">Тачан одговор</p>
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Ниво 5 · Адресе рачунара са јавним Интернет адресама</h2>
                <p class="mt-1 text-sm text-slate-500">Одредите да ли се дата адреса хоста може користити за јавно Интернет адресирање.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level5"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_220px]"
              >
                <div>
                  <p class="text-xs font-medium uppercase text-slate-500">Адреса</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.addressCidr }}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase  text-slate-500">Употребљива на Интернету?</p>
                  <USelect
                    v-model="answers.level5[index]"
                    class="w-full"
                    :items="networkOptions"
                    :disabled="!data.attempt.canSubmit"
                    :class="fieldClass(compareValue(answers.level5[index], row.correctAnswer, 'text'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase text-slate-500">Тачан одговор</p>
                    <UInput :model-value="yesNoLabel(row.correctAnswer)" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Ниво 6 · Локалне и удаљене адресе</h2>
                <p class="mt-1 text-sm text-slate-500">
                  Одредите да ли сваки пар адреса припада истој мрежи.
                </p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level6"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_1fr_1fr_220px]"
              >
                <div>
                  <p class="text-xs font-medium uppercase  text-slate-500">Адреса 1</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.ip1 }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase  text-slate-500">Адреса 2</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.ip2 }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase  text-slate-500">Маска подмреже</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.mask }}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase  text-slate-500">Иста мрежа?</p>
                  <USelect
                    v-model="answers.level6[index]"
                    class="w-full"
                    :items="networkOptions"
                    :disabled="!data.attempt.canSubmit"
                    :class="fieldClass(compareValue(answers.level6[index], row.correctAnswer, 'text'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase  text-slate-500">Тачан одговор</p>
                    <UInput :model-value="yesNoLabel(row.correctAnswer)" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Ниво 7 · Пројекат подмрежавања</h2>
                <p class="mt-1 text-sm text-slate-500">
                  Поделите {{ data.sections.level7.baseNetwork }}/{{ data.sections.level7.baseCidr }} на захтеване величине подмрежа.
                </p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level7.subnets"
                :key="row.id"
                class="space-y-4 rounded-2xl border border-slate-200 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-xs font-medium uppercase  text-slate-500">{{ row.name }}</p>
                    <p class="mt-1 text-sm text-slate-900">{{ row.hosts }} хостова потребно</p>
                  </div>
                </div>

                <div class="grid gap-4 lg:grid-cols-3">
                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase  text-slate-500">Мрежна адреса</p>
                    <UInput
                      v-model="answers.level7[index]!.network"
                      class="w-full"
                      :disabled="!data.attempt.canSubmit"
                      :class="fieldClass(compareValue(answers.level7[index]?.network, row.correctNetwork, 'ip'))"
                    />
                    <div v-if="showSolutions" class="space-y-2">
                      <p class="text-xs font-medium uppercase  text-slate-500">Тачан одговор</p>
                      <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase  text-slate-500">Маска подмреже</p>
                    <UInput
                      v-model="answers.level7[index]!.mask"
                      class="w-full"
                      :disabled="!data.attempt.canSubmit"
                      :class="fieldClass(compareValue(answers.level7[index]?.mask, row.correctMask, 'ip'))"
                    />
                    <div v-if="showSolutions" class="space-y-2">
                      <p class="text-xs font-medium uppercase  text-slate-500">Тачан одговор</p>
                      <UInput :model-value="row.correctMask || ''" readonly class="w-full field-correct" />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase  text-slate-500">Емисиона адреса</p>
                    <UInput
                      v-model="answers.level7[index]!.broadcast"
                      class="w-full"
                      :disabled="!data.attempt.canSubmit"
                      :class="fieldClass(compareValue(answers.level7[index]?.broadcast, row.correctBroadcast, 'ip'))"
                    />
                    <div v-if="showSolutions" class="space-y-2">
                      <p class="text-xs font-medium uppercase  text-slate-500">Тачан одговор</p>
                      <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
                    </div>
                  </div>
                </div>
              </div>
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
