import { computed, ref } from 'vue'

function decimalToBinary(decimal: number) {
  return decimal.toString(2).padStart(8, '0')
}

export function useIpOctetConverter() {
  const decimalOctetInput = ref('')
  const binaryOctetInput = ref('')

  const decimalToBinaryOutput = computed(() => {
    const value = decimalOctetInput.value.trim()

    if (!value) {
      return ''
    }

    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
      return 'Невалидна вредност'
    }

    return decimalToBinary(parsed)
  })

  const binaryToDecimalOutput = computed(() => {
    const value = binaryOctetInput.value.trim()

    if (!value) {
      return ''
    }

    if (!/^[01]{8}$/.test(value)) {
      return 'Невалидна вредност'
    }

    return String(Number.parseInt(value, 2))
  })

  return {
    binaryOctetInput,
    binaryToDecimalOutput,
    decimalOctetInput,
    decimalToBinaryOutput,
  }
}
