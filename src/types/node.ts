import type http from 'http'
import type { H3Event } from '../event'

export interface H3CompatbilityAugmentions {
  event: H3Event,
  req: H3Event['req'],
  res: H3Event['res']
}

export interface IncomingMessage extends http.IncomingMessage, H3CompatbilityAugmentions {
  originalUrl?: string // Connect and Express
}
export interface ServerResponse extends http.ServerResponse, Omit<H3CompatbilityAugmentions, 'req'> {
  req: http.ServerResponse['req'] & {
    event: H3Event
    originalUrl?: string // Connect and Express
  }
}

export type Encoding = false | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'
