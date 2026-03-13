import { withSafeApi } from '#server/utils/safe-api'
import { setAdminSession, verifyAdminCredentials } from '#server/utils/service/auth'

export default withSafeApi(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  await verifyAdminCredentials(body.email || '', body.password || '')
  setAdminSession(event)

  return {
    success: true,
  }
})
