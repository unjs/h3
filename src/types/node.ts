import type { IncomingMessage as BaseIncomingMessage } from 'http'
export type { ServerResponse } from 'http'

export type Encoding = false | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'

export interface IncomingMessage extends BaseIncomingMessage {
    params?: Record<string, any>
    originalUrl?: string
}
