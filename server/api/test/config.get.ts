import { getTestConfig } from '../../utils/service/test-config'

export default defineEventHandler(async () => {
  return getTestConfig()
})
