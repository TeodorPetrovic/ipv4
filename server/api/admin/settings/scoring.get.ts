import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { getScoringSettings } from '#server/utils/service/settings'

export default withSafeApi(async (event) => {
  requireAdminSession(event)

  return getScoringSettings()
})
