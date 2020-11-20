import type { IncomingMessage, ServerResponse } from 'http'
import type { Stack, InputLayer, Handle, App, AppOptions } from './types'
import { promisifyHandle } from './promisify'
import { send, createError, error, MIMES } from './utils'

export function createApp (options: AppOptions = {}): App {
  const stack: Stack = []

  async function unsafeHandle (req: IncomingMessage, res: ServerResponse) {
    const originalUrl = (req as any).originalUrl || req.url || '/'
    const originalUrlL = originalUrl.toLowerCase()

    for (const layer of stack) {
      // Routing
      if (layer.route.length) {
        if (!originalUrlL.startsWith(layer.route)) {
          continue
        }
        req.url = originalUrl.substr(layer.route.length) || '/'
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
        send(res, JSON.stringify(val, null, 2), MIMES.json)
        break
      }
    }

    if (!res.writableEnded) {
      throw createError(404, 'Not Found')
    }
  }

  const handle: Handle = function (req: IncomingMessage, res: ServerResponse) {
    return unsafeHandle(req, res).catch((err: Error | any) => { error(res, err, options.debug) })
  }

  function use (route: string, handle: Handle) {
    stack.push(normalizeLayer({ route, handle }))
  }

  return {
    stack,
    use,
    handle,
    unsafeHandle
  }
}

function normalizeLayer (layer: InputLayer) {
  return {
    route: stripTrailingSlash(layer.route).toLocaleLowerCase(),
    handle: promisifyHandle(layer.handle)
  }
}

function stripTrailingSlash (str: string = '') {
  return str.endsWith('/') ? str.slice(0, -1) : str
}
