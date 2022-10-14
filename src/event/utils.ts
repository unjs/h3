import type { EventHandler, LazyEventHandler } from '../types'

export function defineEventHandler <T = any> (handler: EventHandler<T>): EventHandler<T> {
  handler.__is_handler__ = true
  return handler
}
export const eventHandler = defineEventHandler

export function isEventHandler (input: any): input is EventHandler {
  return '__is_handler__' in input
}

export function toEventHandler (input: any, _?: any, _route?: string): EventHandler {
  if (!isEventHandler(input)) {
    // eslint-disable-next-line no-console
    console.warn(
      '[h3] Implicit event handler conversion is deprecated. Please use eventHandler() or fromNodeMiddleware() to define event handlers.',
      '\n' + `Route: ${_route || '?'}`,
      '\n' + `Handler: ${input}`,
      '\n' + (new Error('-').stack?.split('\n').splice(2).join('\n'))
    )
  }
  return input
}

export interface DynamicEventHandler extends EventHandler {
  set: (handler: EventHandler) => void
}

export function dynamicEventHandler (initial?: EventHandler): DynamicEventHandler {
  let current: EventHandler | undefined = initial
  const wrapper = eventHandler((event) => {
    if (current) {
      return current(event)
    }
  }) as DynamicEventHandler
  wrapper.set = (handler) => { current = handler }
  return wrapper
}

export function defineLazyEventHandler (factory: LazyEventHandler): EventHandler {
  let _promise: Promise<EventHandler>
  let _resolved: EventHandler
  const resolveHandler = () => {
    if (_resolved) { return Promise.resolve(_resolved) }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r: any) => {
        const handler = r.default || r
        if (typeof handler !== 'function') {
          throw new (TypeError as any)('Invalid lazy handler result. It should be a function:', handler)
        }
        _resolved = toEventHandler(r.default || r)
        return _resolved
      })
    }
    return _promise
  }
  return eventHandler((event) => {
    if (_resolved) {
      return _resolved(event)
    }
    return resolveHandler().then(handler => handler(event))
  })
}
export const lazyEventHandler = defineLazyEventHandler
