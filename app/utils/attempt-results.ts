export function compareSubmittedValue(
  studentAnswer: string | null | undefined,
  correctAnswer: string | null | undefined,
  mode: 'ip' | 'text' | 'number' = 'ip',
) {
  if (!correctAnswer) {
    return null
  }

  if (mode === 'number') {
    return Number(studentAnswer || '0') === Number(correctAnswer)
  }

  return (studentAnswer || '').trim() === correctAnswer.trim()
}

export function resultFieldClass(isCorrect: boolean | null) {
  if (isCorrect === null) {
    return ''
  }

  return isCorrect ? 'field-correct' : 'field-wrong'
}

export function yesNoLabel(value: string | null | undefined) {
  if (value === '1') {
    return 'Да'
  }

  if (value === '0') {
    return 'Не'
  }

  return ''
}
