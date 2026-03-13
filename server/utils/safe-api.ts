import { createError, defineEventHandler } from 'h3'
import type { EventHandlerRequest, H3Event } from 'h3'

type ApiHandler = (event: H3Event<EventHandlerRequest>) => Promise<unknown> | unknown

function hasStatusCode(value: unknown): value is { statusCode: number } {
  return typeof value === 'object' && value !== null && 'statusCode' in value && typeof (value as { statusCode?: unknown }).statusCode === 'number'
}

export function withSafeApi(handler: ApiHandler, fallbackMessage = 'Unable to process request') {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error) {
      if (hasStatusCode(error)) {
        throw error
      }

      throw createError({
        statusCode: 500,
        message: fallbackMessage,
      })
    }
  })
}
