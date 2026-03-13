<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { StudentTest } from '#shared/types/api'

definePageMeta({
  layout: 'student',
})

const { t } = useAppI18n()
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const loadingActionId = ref<number | null>(null)
const loadingPage = ref(false)
const pageError = ref('')
const globalFilter = ref('')
const tests = ref<StudentTest[]>([])
const confirmOpen = ref(false)
const selectedTest = ref<StudentTest | null>(null)

async function loadTests() {
  loadingPage.value = true

  try {
    tests.value = await $fetch<StudentTest[]>('/api/tests', {
      headers: requestHeaders,
    })
    pageError.value = ''
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || t('tests.errors.loadFailed')
  } finally {
    loadingPage.value = false
  }
}

await loadTests()

function actionLabel(_test: StudentTest) {
  return t('tests.start')
}

const columns = computed<TableColumn<StudentTest>[]>(() => [
  {
    accessorKey: 'title',
    header: t('tests.table.test'),
  },
  {
    id: 'action',
    header: t('tests.table.action'),
  },
])

function askStartTest(test: StudentTest) {
  selectedTest.value = test
  confirmOpen.value = true
}

function cancelStartTest() {
  confirmOpen.value = false
  selectedTest.value = null
}

async function confirmStartTest() {
  const test = selectedTest.value
  if (!test) {
    return
  }

  confirmOpen.value = false
  selectedTest.value = null
  await openTest(test)
}

async function openTest(test: StudentTest) {
  pageError.value = ''
  loadingActionId.value = test.id

  try {
    if (test.activeAttemptId) {
      await navigateTo(`/test/${test.activeAttemptId}`)
      return
    }

    const response = await $fetch<{ attemptId: number }>(`/api/tests/${test.id}/start`, {
      method: 'POST',
    })

    await loadTests()
    await navigateTo(`/test/${response.attemptId}`)
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || t('tests.errors.openFailed')
  } finally {
    loadingActionId.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <UInput
        v-model="globalFilter"
        :placeholder="t('tests.searchPlaceholder')"
        icon="i-lucide-search"
        class="w-full sm:max-w-xs"
      />

      <div class="flex flex-wrap gap-2">
        <UButton color="neutral" variant="outline" :loading="loadingPage" icon="i-lucide-refresh-ccw" @click="loadTests">
          {{ t('common.refresh') }}
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="pageError"
      color="error"
      variant="soft"
      :title="pageError"
    />

    <div class="table-shell overflow-hidden rounded-lg border border-default">
      <UTable
        v-model:global-filter="globalFilter"
        :data="tests"
        :columns="columns"
        :loading="loadingPage || loadingActionId !== null"
        sticky="header"
        :empty="t('tests.empty')"
        class="dark:bg-muted bg-muted"
      >
        <template #title-cell="{ row }">
          <div>
            <p class="text-black font-bold dark:text-white">{{ row.original.title }}</p>
          </div>
        </template>

        <template #action-header>
          <div class="w-full text-right">
            {{ t('tests.table.action') }}
          </div>
        </template>

        <template #action-cell="{ row }">
          <div class="flex w-full justify-end">
            <UButton
              color="neutral"
              variant="outline"
              :loading="loadingActionId === row.original.id"
              @click="askStartTest(row.original)"
            >
              {{ actionLabel(row.original) }}
            </UButton>
          </div>
        </template>
      </UTable>
    </div>

    <UModal
      v-model:open="confirmOpen"
      :title="t('tests.confirm.title')"
      :description="t('tests.confirm.description')"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="primary" @click="cancelStartTest">
            {{ t('common.cancel') }}
          </UButton>
          <UButton class="bg-sky-500" @click="confirmStartTest">
            {{ t('common.yes') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
