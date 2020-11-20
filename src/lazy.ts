import type { IncomingMessage, ServerResponse } from 'http'
import { LazyHandle, Handle, PHandle } from './types'
import { promisifyHandle } from './promisify'

export function lazyHandle (handle: LazyHandle, promisify: boolean = true): PHandle {
  let _promise: Promise<Handle>
  const resolve = () => {
    if (!_promise) {
      _promise = Promise.resolve(handle())
        .then((r: any) => promisify ? promisifyHandle(r.default || r) : (r.default || r))
    }
    return _promise
  }
  return function (req: IncomingMessage, res: ServerResponse) {
    return resolve().then(h => h(req, res))
  }
}
