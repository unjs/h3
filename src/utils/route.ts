import { withoutTrailingSlash, withoutBase } from 'ufo'
import { eventHandler } from 'src/event'
import { EventHandler } from 'src/types'

export function useBase (base: string, handler: EventHandler): EventHandler {
  base = withoutTrailingSlash(base)
  if (!base) { return handler }
  return eventHandler((event) => {
    (event.req as any).originalUrl = (event.req as any).originalUrl || event.req.url || '/'
    event.req.url = withoutBase(event.req.url || '/', base)
    return handler(event)
  })
}
