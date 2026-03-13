import { withSafeApi } from '#server/utils/safe-api'
import { getAuthState } from '#server/utils/service/auth'

export default withSafeApi((event) => {
  return getAuthState(event)
})
