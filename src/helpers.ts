import type { App, AppUse, Middleware } from 'src/types'

interface AppWithHelpers extends App {
  delete: (route: string, handler: Middleware) => AppWithHelpers
  get: (route: string, handler: Middleware) => AppWithHelpers
  patch: (route: string, handler: Middleware) => AppWithHelpers
  post: (route: string, handler: Middleware) => AppWithHelpers
  put: (route: string, handler: Middleware) => AppWithHelpers
  use: AppUse<AppWithHelpers>
  useAsync: AppUse<AppWithHelpers>
}

const methods = ['GET', 'PATCH', 'POST', 'PUT', 'DELETE'] as const

export function installMethodHelpers (app: App): asserts app is AppWithHelpers {
  methods.forEach((method) => {
    ;(app as AppWithHelpers)[method.toLowerCase() as 'get'] = (route, handler) =>
      (app as AppWithHelpers).use(route, (req, res, next) => {
        if (req.method !== method) {
          return next()
        }
        return handler(req, res, next)
      })
  })
}
