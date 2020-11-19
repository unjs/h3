import type { IncomingMessage, ServerResponse } from 'http'
import type { Handle, Middleware } from './types'

export function promisifyHandle (handle: Handle | Middleware): Handle {
  return function (req: IncomingMessage, res: ServerResponse) {
    return callHandle(handle as Handle, req, res)
  }
}

function callHandle (handle: Middleware, req: IncomingMessage, res: ServerResponse) {
  return new Promise((resolve, reject) => {
    const next = (err?: Error) => err ? reject(err) : resolve()
    try {
      const returned = handle(req, res, next)
      if (returned !== undefined) {
        resolve(returned)
      } else {
        res.once('close', next)
        res.once('error', next)
      }
    } catch (err) {
      next(err)
    }
  })
}
