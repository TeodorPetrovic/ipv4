<script setup lang="ts">
import type { StudentAttemptResultsPayload } from '#shared/types/test-attempt'
import { compareSubmittedValue, resultFieldClass, yesNoLabel } from '~/utils/attempt-results'

definePageMeta({
  layout: 'student',
})

const route = useRoute()
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
</script>

<template>
  <div class="space-y-6">
    <div v-if="error" class="mx-auto max-w-xl space-y-4">
      <UAlert
        color="error"
        variant="soft"
        title="Није могуће учитати резултате"
        :description="(error as any)?.data?.message || 'Резултати нису доступни.'"
      />
      <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" to="/tests">
        Назад на листу тестова
      </UButton>
    </div>

    <div v-else-if="data" class="mx-auto max-w-5xl space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-highlighted">{{ data.attempt.title }}</h1>
          <p class="mt-1 text-sm text-muted">
            {{ data.attempt.status === 'expired' ? 'Рок за предају је истекао' : 'Тест предат' }}
            <span v-if="data.attempt.submittedAt"> · {{ new Date(data.attempt.submittedAt).toLocaleString() }}</span>
          </p>
        </div>
        <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" to="/tests">
          Назад на листу тестова
        </UButton>
      </div>

      <div class="rounded-lg border border-default bg-elevated p-5">
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
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Бинарни</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Ваш одговор</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Тачан одговор</th>
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
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Ваш одговор</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Тачан одговор</th>
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
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Тачна мрежна</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Емисиона адреса</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Тачна емисиона</th>
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
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Ваш одговор</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Тачан одговор</th>
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
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Ваш одговор</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Тачан одговор</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.sections.level5" :key="row.id" class="border-b border-default last:border-0">
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.addressCidr }}</td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="yesNoLabel(row.studentAnswer)" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'text'))" />
                </td>
                <td class="px-4 py-3 text-center">
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
            <p class="mt-1 text-sm text-muted">Одредите да ли сваки пар адреса припада истој мрежи.</p>
          </div>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-sm">
            <thead class="border-b border-default bg-muted/30">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Адреса 1</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Адреса 2</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Маска подмреже</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Ваш одговор</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-muted">Тачан одговор</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.sections.level6" :key="row.id" class="border-b border-default last:border-0">
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip1 }}</td>
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.ip2 }}</td>
                <td class="px-4 py-3 text-center font-mono text-toned">{{ row.mask }}</td>
                <td class="px-4 py-3 text-center">
                  <UInput :model-value="yesNoLabel(row.studentAnswer)" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentAnswer, row.correctAnswer, 'text'))" />
                </td>
                <td class="px-4 py-3 text-center">
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
              <template v-for="row in data.sections.level7.subnets" :key="row.id">
                <tr class="border-b border-default">
                  <td class="px-4 py-3 text-center font-medium text-toned">{{ row.name }}</td>
                  <td class="px-4 py-3 text-center text-toned">{{ row.hosts }}</td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">Ваша мрежна адреса</p>
                    <UInput :model-value="row.studentNetwork || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentNetwork, row.correctNetwork, 'ip'))" />
                  </td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">Ваша маска</p>
                    <UInput :model-value="row.studentMask || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentMask, row.correctMask, 'ip'))" />
                  </td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">Ваша емисиона адреса</p>
                    <UInput :model-value="row.studentBroadcast || ''" readonly class="w-full" :class="resultFieldClass(compareSubmittedValue(row.studentBroadcast, row.correctBroadcast, 'ip'))" />
                  </td>
                </tr>
                <tr class="border-b border-default last:border-0 bg-muted/10">
                  <td class="px-4 py-3 text-center font-medium text-toned">{{ row.name }}</td>
                  <td class="px-4 py-3 text-center text-toned">{{ row.hosts }}</td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">Тачна мрежна адреса</p>
                    <UInput :model-value="row.correctNetwork || ''" readonly class="w-full field-correct" />
                  </td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">Тачна маска</p>
                    <UInput :model-value="row.correctMask || ''" readonly class="w-full field-correct" />
                  </td>
                  <td class="px-4 py-3">
                    <p class="mb-2 text-xs font-medium text-muted">Тачна емисиона адреса</p>
                    <UInput :model-value="row.correctBroadcast || ''" readonly class="w-full field-correct" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>

      <div class="flex justify-center pb-10">
        <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" to="/tests">
          Назад на листу тестова
        </UButton>
      </div>
    </div>
  </div>
</template>
