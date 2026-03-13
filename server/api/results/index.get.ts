import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { getAllResults } from '#server/utils/service/results'

export default withSafeApi(async (event) => {
  requireAdminSession(event)
  return getAllResults()
})
