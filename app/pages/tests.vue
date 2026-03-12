<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AuthState, StudentTest } from '#shared/types/api'

definePageMeta({
  layout: 'student',
})

const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const loadingActionId = ref<number | null>(null)
const loadingPage = ref(false)
const pageError = ref('')
const globalFilter = ref('')
const tests = ref<StudentTest[]>([])
const confirmOpen = ref(false)
const selectedTest = ref<StudentTest | null>(null)

const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.student) {
  await navigateTo('/login')
}

async function loadTests() {
  loadingPage.value = true

  try {
    tests.value = await $fetch<StudentTest[]>('/api/tests', {
      headers: requestHeaders,
    })
    pageError.value = ''
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || 'Unable to load tests'
  } finally {
    loadingPage.value = false
  }
}

if (authState.value?.student) {
  await loadTests()
}

function actionLabel(_test: StudentTest) {
  return 'Start'
}

const columns: TableColumn<StudentTest>[] = [
  {
    accessorKey: 'title',
    header: 'Test',
  },
  {
    id: 'action',
    header: 'Action',
  },
]

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
    pageError.value = fetchError.data?.message || 'Unable to open this test'
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
        placeholder="Search tests"
        icon="i-lucide-search"
        class="w-full sm:max-w-xs"
      />

      <div class="flex flex-wrap gap-2">
        <UButton color="neutral" variant="outline" :loading="loadingPage" icon="i-lucide-refresh-ccw" @click="loadTests">
          Refresh
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
        empty="No tests available."
      >
        <template #title-cell="{ row }">
          <div>
            <p class="font-medium">{{ row.original.title }}</p>
          </div>
        </template>

        <template #action-header>
          <div class="w-full text-right">
            Action
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
      title="Start test"
      description="Do you want to start this test now?"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="cancelStartTest">
            Cancel
          </UButton>
          <UButton color="primary" @click="confirmStartTest">
            Yes
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

