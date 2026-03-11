import { setAdminSession, verifyAdminCredentials } from '../../utils/service/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  await verifyAdminCredentials(body.email || '', body.password || '')
  setAdminSession(event)

  return {
    success: true,
  }
})
