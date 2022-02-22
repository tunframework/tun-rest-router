import { Server } from 'http'
import { AddressInfo, ListenOptions } from 'net'
import { TunApplication } from 'tun'

import { RestifyRouter } from '../../lib/index.js'

export function prepareApp(
  option: ListenOptions = { host: 'localhost', port: 0 }
) {
  const app = new TunApplication()
  const router = new RestifyRouter()

  return {
    app,
    router,
    boot: (
      cb: (server: Server) => void,
      option: ListenOptions = { host: '127.0.0.1', port: 0 }
    ) => {
      app.use(router.routes())
      const server = app.listen(option)
      server.on('listening', () => {
        let addr = (server.address() || {}) as AddressInfo
        const url = [addr.address, addr.port].filter(Boolean).join(':')
        console.log(`temp test app url: ${url}`)
        // assert.ok(url, `server url should not be empty`);
        try {
          cb(server)
        } catch (error) {
          console.error(error)
          // assert.fail(error.message);
        } finally {
          closeServer(server)
        }
      })
      return server
    }
  }
}

function closeServer(server: Server) {
  server.close()
}
