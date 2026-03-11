<script setup lang="ts">
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
    level5: Array<{ id: number; ip1: string; ip2: string | null; mask: string | null; studentAnswer: string | null; correctAnswer: string | null }>
    level6: {
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
const networkOptions = ['Yes', 'No']

const { data: authState } = await useFetch('/api/auth/session', {
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
const decInput = ref('')
const binInput = ref('')
const convResult = ref('')
const convError = ref('')

const answers = reactive({
  level1: [] as string[],
  level2: [] as string[],
  level3: [] as Array<{ network: string; broadcast: string }>,
  level4: [] as string[],
  level5: [] as string[],
  level6: [] as Array<{ network: string; mask: string; broadcast: string }>,
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
  answers.level6 = data.value.sections.level6.subnets.map(row => ({
    network: row.studentNetwork || '',
    mask: row.studentMask || '',
    broadcast: row.studentBroadcast || '',
  }))
}

watch(data, syncAnswers, { immediate: true })

const showSolutions = computed(() => Boolean(data.value?.attempt.submittedAt || data.value?.attempt.status === 'expired'))

function formatDate(value: string | null) {
  if (!value) {
    return 'Not available'
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

function ipToBinary(ip: string) {
  return ip.split('.').map(octet => decimalToBinary(Number(octet))).join('.')
}

function binaryToIp(binary: string) {
  return binary.split('.').map(octet => Number.parseInt(octet, 2).toString()).join('.')
}

function isValidIp(ip: string) {
  const parts = ip.split('.')
  return parts.length === 4 && parts.every(part => {
    const value = Number(part)
    return Number.isInteger(value) && value >= 0 && value <= 255
  })
}

function convertDecToBin() {
  convError.value = ''
  convResult.value = ''

  if (!isValidIp(decInput.value.trim())) {
    convError.value = 'Use a valid IPv4 address'
    return
  }

  convResult.value = ipToBinary(decInput.value.trim())
}

function convertBinToDec() {
  convError.value = ''
  convResult.value = ''

  const parts = binInput.value.trim().split('.')

  if (parts.length !== 4 || !parts.every(part => /^[01]{8}$/.test(part))) {
    convError.value = 'Use format 11000000.10101000.00000001.00000001'
    return
  }

  convResult.value = binaryToIp(binInput.value.trim())
}

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
    submitError.value = fetchError.data?.message || 'Unable to submit this attempt'
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
          title="Unable to load this attempt"
          :description="(error as any)?.data?.message || 'This attempt is not available.'"
        />
      </div>

      <div v-else-if="data" class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="lg:sticky lg:top-6 lg:self-start">
          <UCard>
            <template #header>
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Utility</p>
                <h2 class="mt-2 text-lg font-semibold text-slate-950">IP converter</h2>
              </div>
            </template>

            <div class="space-y-4">
              <div class="space-y-2">
                <p class="text-sm font-medium text-slate-800">Decimal to binary</p>
                <UInput v-model="decInput" class="w-full" placeholder="192.168.1.1" @keyup.enter="convertDecToBin" />
                <UButton block color="neutral" variant="outline" @click="convertDecToBin">
                  Convert
                </UButton>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium text-slate-800">Binary to decimal</p>
                <UInput v-model="binInput" class="w-full" placeholder="11000000.10101000.00000001.00000001" @keyup.enter="convertBinToDec" />
                <UButton block color="neutral" variant="outline" @click="convertBinToDec">
                  Convert
                </UButton>
              </div>

              <UAlert v-if="convResult" color="success" variant="soft" :title="convResult" />
              <UAlert v-if="convError" color="error" variant="soft" :title="convError" />
            </div>
          </UCard>
        </aside>

        <main class="mx-auto w-full max-w-5xl space-y-6">
          <UCard>
            <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-3">
                <UBadge color="neutral" variant="subtle">
                  Attempt {{ data.attempt.attemptNumber }}
                </UBadge>
                <div>
                  <h1 class="text-3xl font-semibold text-slate-950">{{ data.attempt.title }}</h1>
                  <p class="mt-2 text-sm leading-6 text-slate-600">
                    {{ data.attempt.description || 'Complete every IPv4 section carefully. Your exact generated tasks are saved per attempt.' }}
                  </p>
                </div>
              </div>

              <div class="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <p class="font-medium text-slate-950">Started</p>
                  <p class="mt-1">{{ formatDate(data.attempt.startedAt) }}</p>
                </div>
                <div>
                  <p class="font-medium text-slate-950">Deadline</p>
                  <p class="mt-1">{{ formatDate(data.attempt.deadlineAt) }}</p>
                </div>
                <div>
                  <p class="font-medium text-slate-950">Status</p>
                  <p class="mt-1 capitalize">{{ data.attempt.status.replace('_', ' ') }}</p>
                </div>
                <div>
                  <p class="font-medium text-slate-950">Score</p>
                  <p class="mt-1">{{ data.attempt.score }} / {{ data.attempt.totalQuestions }}</p>
                </div>
              </div>
            </div>
          </UCard>

          <UAlert
            v-if="data.attempt.status === 'expired'"
            color="error"
            variant="soft"
            title="This attempt expired before submission."
            description="The page remains visible so you can review the generated tasks and correct answers."
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
            :title="`Result: ${data.attempt.percentage}%`"
            :description="`${data.attempt.score} / ${data.attempt.totalQuestions} correct points`"
          />

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Level 1 · Binary to decimal</h2>
                <p class="mt-1 text-sm text-slate-500">Convert the binary IPv4 address to decimal form.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level1"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_1fr]"
              >
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Binary</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.binary }}</p>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Decimal answer</p>
                  <UInput
                    v-model="answers.level1[index]"
                    class="w-full"
                    :disabled="!data.attempt.canSubmit"
                    placeholder="192.168.1.1"
                    :class="fieldClass(compareValue(answers.level1[index], row.correctAnswer, 'ip'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Level 2 · IPv4 class identification</h2>
                <p class="mt-1 text-sm text-slate-500">Identify the class of each IPv4 address.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level2"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_220px]"
              >
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">IP address</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.ip }}</p>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Class</p>
                  <USelect
                    v-model="answers.level2[index]"
                    class="w-full"
                    :items="classOptions"
                    :disabled="!data.attempt.canSubmit"
                    placeholder="Select class"
                    :class="fieldClass(compareValue(answers.level2[index], row.correctAnswer, 'text'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Level 3 · Network and broadcast</h2>
                <p class="mt-1 text-sm text-slate-500">Calculate the network and broadcast addresses for each host/CIDR pair.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level3"
                :key="row.id"
                class="space-y-4 rounded-2xl border border-slate-200 p-4"
              >
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Host address</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.hostIp }}</p>
                </div>

                <div class="grid gap-4 lg:grid-cols-2">
                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Network address</p>
                    <UInput
                      v-model="answers.level3[index].network"
                      class="w-full"
                      :disabled="!data.attempt.canSubmit"
                      placeholder="192.168.1.0"
                      :class="fieldClass(compareValue(answers.level3[index].network, row.correctNetwork, 'ip'))"
                    />
                    <div v-if="showSolutions" class="space-y-2">
                      <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
                      <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Broadcast address</p>
                    <UInput
                      v-model="answers.level3[index].broadcast"
                      class="w-full"
                      :disabled="!data.attempt.canSubmit"
                      placeholder="192.168.1.255"
                      :class="fieldClass(compareValue(answers.level3[index].broadcast, row.correctBroadcast, 'ip'))"
                    />
                    <div v-if="showSolutions" class="space-y-2">
                      <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
                      <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Level 4 · Host capacity</h2>
                <p class="mt-1 text-sm text-slate-500">Write the number of usable hosts for each subnet mask.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level4"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_240px]"
              >
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Subnet mask</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.mask }}</p>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Usable hosts</p>
                  <UInput
                    v-model="answers.level4[index]"
                    class="w-full"
                    :disabled="!data.attempt.canSubmit"
                    placeholder="254"
                    :class="fieldClass(compareValue(answers.level4[index], row.correctAnswer, 'number'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Level 5 · Same network check</h2>
                <p class="mt-1 text-sm text-slate-500">Decide whether both hosts belong to the same network.</p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level5"
                :key="row.id"
                class="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_1fr_1fr_220px]"
              >
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Address 1</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.ip1 }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Address 2</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.ip2 }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Subnet mask</p>
                  <p class="mt-2 font-mono text-sm text-slate-900">{{ row.mask }}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Same network?</p>
                  <USelect
                    v-model="answers.level5[index]"
                    class="w-full"
                    :items="networkOptions"
                    :disabled="!data.attempt.canSubmit"
                    placeholder="Select answer"
                    :class="fieldClass(compareValue(answers.level5[index], row.correctAnswer, 'text'))"
                  />
                  <div v-if="showSolutions" class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
                    <UInput :model-value="row.correctAnswer || ''" readonly class="w-full field-correct" />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Level 6 · VLSM</h2>
                <p class="mt-1 text-sm text-slate-500">
                  Subnet {{ data.sections.level6.baseNetwork }}/{{ data.sections.level6.baseCidr }} to satisfy the host requirements below.
                </p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="(row, index) in data.sections.level6.subnets"
                :key="row.id"
                class="space-y-4 rounded-2xl border border-slate-200 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{{ row.name }}</p>
                    <p class="mt-1 text-sm text-slate-900">{{ row.hosts }} hosts required</p>
                  </div>
                </div>

                <div class="grid gap-4 lg:grid-cols-3">
                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Network address</p>
                    <UInput
                      v-model="answers.level6[index].network"
                      class="w-full"
                      :disabled="!data.attempt.canSubmit"
                      placeholder="192.168.0.0"
                      :class="fieldClass(compareValue(answers.level6[index].network, row.correctNetwork, 'ip'))"
                    />
                    <div v-if="showSolutions" class="space-y-2">
                      <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
                      <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Subnet mask</p>
                    <UInput
                      v-model="answers.level6[index].mask"
                      class="w-full"
                      :disabled="!data.attempt.canSubmit"
                      placeholder="255.255.255.0"
                      :class="fieldClass(compareValue(answers.level6[index].mask, row.correctMask, 'ip'))"
                    />
                    <div v-if="showSolutions" class="space-y-2">
                      <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
                      <UInput :model-value="row.correctMask || ''" readonly class="w-full field-correct" />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Broadcast address</p>
                    <UInput
                      v-model="answers.level6[index].broadcast"
                      class="w-full"
                      :disabled="!data.attempt.canSubmit"
                      placeholder="192.168.0.255"
                      :class="fieldClass(compareValue(answers.level6[index].broadcast, row.correctBroadcast, 'ip'))"
                    />
                    <div v-if="showSolutions" class="space-y-2">
                      <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Correct answer</p>
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
              Submit Answers
            </UButton>
            <UButton size="xl" color="neutral" variant="outline" to="/tests">
              Back to Test List
            </UButton>
          </div>
        </main>
      </div>
  </div>
</template>
