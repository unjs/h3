import { Server } from 'http'
import type { AddressInfo, Server as NetServer } from 'net'
import type { Handle } from './types'

const defaultPort = parseInt(process.env.PORT || '') || 3000
const defaultHost = 'localhost'

export async function listen (handle: Handle, port: number = defaultPort, host: string = defaultHost) {
  const _server = new Server(handle)

  const server: NetServer = await new Promise((resolve, reject) => {
    // @ts-ignore
    const l = _server.listen(port, host, (err: Error) => err ? reject(err) : resolve(l))
  })

  const address = server.address() as AddressInfo
  port = address.port || port

  return {
    _server,
    server,
    address,
    port,
    url: `http://${host}:${port}`
  }
}
