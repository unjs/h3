import type { IncomingMessage, ServerResponse } from 'http'
import { LazyHandle, Handle } from './types'

export function lazy (handle: LazyHandle): Handle {
  let _promise: Promise<Handle>

  const resolve = () => {
    if (!_promise) {
      _promise = Promise.resolve(handle()).then((r: any) => r.default || r)
    }
    return _promise
  }

  return function (req: IncomingMessage, res: ServerResponse) {
    return resolve().then(h => h(req, res))
  }
}
