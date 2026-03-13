<script setup lang="ts">
const { authState, ensureAuthSession } = useAuthSession()
await ensureAuthSession()

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
