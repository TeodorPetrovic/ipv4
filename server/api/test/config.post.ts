import { saveTestConfig } from '../../utils/service/test-config'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  await saveTestConfig({
    pin: body.pin,
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    durationMinutes: body.durationMinutes ?? 60,
    verifyOnly: body.verifyOnly,
  })

  return { success: true }
})
