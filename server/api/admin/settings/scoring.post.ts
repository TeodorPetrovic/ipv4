import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { updateScoringSettings } from '#server/utils/service/settings'

export default withSafeApi(async (event) => {
  requireAdminSession(event)

  const body = await readBody<{
    level1?: number
    level2?: number
    level3?: number
    level4?: number
    level5?: number
    level6?: number
    level7?: number
  }>(event)

  return updateScoringSettings(body)
})
