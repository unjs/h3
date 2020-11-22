import type { IncomingMessage, ServerResponse } from 'http'
import type { Handle, PHandle, Middleware } from './types'

export function promisifyHandle (handle: Handle | Middleware): PHandle {
  return function (req: IncomingMessage, res: ServerResponse) {
    return callHandle(handle, req, res)
  }
}

function callHandle (handle: Middleware, req: IncomingMessage, res: ServerResponse) {
  return new Promise((resolve, reject) => {
    const next = (err?: Error) => err ? reject(err) : resolve(undefined)
    try {
      const returned = handle(req, res, next)
      if (returned !== undefined || handle.length !== 3) {
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
