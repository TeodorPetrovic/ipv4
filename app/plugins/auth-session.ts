export default defineNuxtPlugin(async () => {
  const { ensureAuthSession } = useAuthSession()
  await ensureAuthSession()
})
