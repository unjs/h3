import type { IncomingMessage, ServerResponse } from 'http'
import type { Handle, PHandle, NextFn } from './types'

export function promisifyHandle (handle: Handle): PHandle {
  const hasNext = handle.length >= 3 /* req,res,next */
  if (hasNext) {
    return function _promisified (req, res, next) {
      return callHandle(req, res, handle, next)
    }
  } else {
    return function _promisified (req, res) {
      return callHandle(req, res, handle)
    }
  }
}

function callHandle (req: IncomingMessage, res: ServerResponse, handle: Handle, next?: NextFn) {
  const promise = new Promise((resolve, reject) => {
    const _next = next ? (err?: Error, val?: any) => err ? reject(err) : resolve(val) : undefined
    let _promise
    try {
      _promise = handle(req, res, _next)
    } catch (err) {
      reject(err)
    }
    if (!next) {
      resolve(_promise)
    }
  })
  return promise
    .then((val?: any) => next ? next() : (val === undefined ? res.writableEnded : val))
    .catch(err => next && next(err))
}
