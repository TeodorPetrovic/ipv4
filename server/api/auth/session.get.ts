import { getAuthState } from '../../utils/service/auth'

export default defineEventHandler((event) => {
  return getAuthState(event)
})
