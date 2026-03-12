<script setup lang="ts">
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

if (authState.value?.student) {
  await navigateTo('/tests', { replace: true })
} else if (authState.value?.isAdmin) {
  await navigateTo('/admin/tests', { replace: true })
} else {
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <div />
</template>
