import type { IncomingMessage, ServerResponse } from 'http'
import type { Stack, InputLayer, Handle, App } from './types'
import { promisifyHandle } from './promisify'
import { send, error, MIMES } from './utils'

const debug = process.env.NODE_ENV !== 'production' || process.env.DEBUG

export function createApp (): App {
  const stack: Stack = []

  async function _handle (req: IncomingMessage, res: ServerResponse) {
    const originalUrl = (req as any).originalUrl || req.url || '/'
    const originalUrlL = originalUrl.toLowerCase()

    for (const layer of stack) {
      // Routing
      if (layer.route) {
        if (!originalUrlL.startsWith(layer.route)) {
          continue
        }
        req.url = originalUrl.substr(layer.route.length)
      }
      // Direct return support
      const val = await layer.handle(req, res)
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
      error(res, originalUrl, 404)
    }
  }

  const handle: Handle = function (req: IncomingMessage, res: ServerResponse) {
    return _handle(req, res).catch((err: Error | any) => {
      error(res,
        debug ? err.stack : 'internal error',
        res.statusCode || err.status || err.statusCode || 500
      )
    })
  }

  function use (route: string, handle: Handle) {
    stack.push(normalizeLayer({ route, handle }))
  }

  return {
    stack,
    use,
    handle
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
