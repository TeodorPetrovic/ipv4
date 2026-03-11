<script setup lang="ts">
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

if (authState.value?.student) {
  await navigateTo('/tests')
} else if (authState.value?.isAdmin) {
  await navigateTo('/admin/tests')
} else {
  await navigateTo('/login')
}
</script>

<template>
  <div />
</template>
