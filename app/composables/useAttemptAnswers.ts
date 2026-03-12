import { reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { StudentAttemptAnswers, StudentAttemptPayload } from '#shared/types/test-attempt'

function createEmptyAttemptAnswers(): StudentAttemptAnswers {
  return {
    level1: [],
    level2: [],
    level3: [],
    level4: [],
    level5: [],
    level6: [],
    level7: [],
  }
}

export function useAttemptAnswers(data: Ref<StudentAttemptPayload | null | undefined>) {
  const answers = reactive<StudentAttemptAnswers>(createEmptyAttemptAnswers())
  const answersInitialized = ref(false)

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

  return {
    answers,
    answersInitialized,
    syncAnswers,
  }
}
