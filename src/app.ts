import type { IncomingMessage, ServerResponse } from 'http'
import type { Stack, InputLayer, Handle, PHandle, App, AppOptions, LazyHandle } from './types'
import { promisifyHandle } from './promisify'
import { lazyHandle } from './lazy'
import { send, createError, sendError, MIMES, stripTrailingSlash } from './utils'

export function createApp (options: AppOptions = {}): App {
  const stack: Stack = []

  const _handle = createHandle(stack)

  // @ts-ignore
  const app: Partial<App> = function (req: IncomingMessage, res: ServerResponse) {
    return _handle(req, res)
      .catch((err: Error | any) => { sendError(res, err, undefined, options.debug) })
  }

  app.stack = stack
  app._handle = _handle

  // @ts-ignore
  app.use = (arg1, arg2, arg3) => use(app, arg1, arg2, arg3)
  // @ts-ignore
  app.useAsync = (arg1, arg2) =>
    use(app as App, arg1, arg2 !== undefined ? arg2 : { promisify: false }, { promisify: false })

  return app as App
}

export function use (
  app: App,
  arg1: string | Handle | InputLayer | InputLayer[],
  arg2?: Handle | Partial<InputLayer> | Handle[],
  arg3?: Partial<InputLayer>
) {
  if (Array.isArray(arg1)) {
    arg1.forEach(i => use(app, i, arg2, arg3))
  } else if (Array.isArray(arg2)) {
    arg2.forEach(i => use(app, arg1, i, arg3))
  } else if (typeof arg1 === 'string') {
    app.stack.push(normalizeLayer({ ...arg3, route: arg1, handle: arg2 as Handle }))
  } else if (typeof arg1 === 'function') {
    app.stack.push(normalizeLayer({ ...arg2, route: '/', handle: arg1 as Handle }))
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }))
  }
  return app
}

export function createHandle (stack: Stack): PHandle {
  return async function handle (req: IncomingMessage, res: ServerResponse) {
    // @ts-ignore express/connect compatibility
    req.originalUrl = req.originalUrl || req.url || '/'
    const reqUrl = req.url || '/'
    for (const layer of stack) {
      if (layer.route.length) {
        if (!reqUrl.startsWith(layer.route)) {
          continue
        }
        req.url = reqUrl.substr(layer.route.length) || '/'
      }
      if (layer.match && !layer.match(req.url as string, req)) {
        continue
      }
      const val = await layer.handle(req, res)
      if (res.writableEnded) {
        break
      }
      const type = typeof val
      if (type === 'string') {
        send(res, val, MIMES.html)
        break
      } else if (type === 'object' && val !== undefined) {
        if (val.buffer) {
          send(res, val)
        } else {
          send(res, JSON.stringify(val, null, 2), MIMES.json)
        }
        break
      }
    }
    if (!res.writableEnded) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found'
      })
    }
  }
}

function normalizeLayer (layer: InputLayer) {
  return {
    route: stripTrailingSlash(layer.route).toLocaleLowerCase(),
    match: layer.match,
    handle: layer.lazy
      ? lazyHandle(layer.handle as LazyHandle, layer.promisify)
      : (layer.promisify !== false ? promisifyHandle(layer.handle) : layer.handle)
  }
}
