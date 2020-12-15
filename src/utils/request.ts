import type { IncomingMessage } from 'http'
import { getParams } from '@nuxt/ufo'

export function useQuery (req: IncomingMessage) {
  return getParams(req.url || '')
}
