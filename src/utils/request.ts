import type { IncomingMessage } from 'http'
import { getQuery } from 'ufo'

export function useQuery (req: IncomingMessage) {
  return getQuery(req.url || '')
}
