import { getSubmittedResults } from '../../utils/service/results'

export default defineEventHandler(async () => {
  return getSubmittedResults()
})
