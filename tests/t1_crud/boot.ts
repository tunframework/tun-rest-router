import type { Server } from 'http'
import type { AddressInfo, ListenOptions } from 'net'
import { TunApplication } from '@tunframework/tun'

import { RestifyRouter } from '../../src/index.js'
import { allowedMethods } from '../../src/route-utils.js'

import { bodyparser } from '@tunframework/tun-bodyparser'

export function prepareApp() {
  const app = new TunApplication()
  const router = new RestifyRouter()

  return {
    app,
    router,
    boot: (
      cb: (server: Server, url: string) => Promise<void>,
      option: ListenOptions = { host: '127.0.0.1', port: 0 }
    ) => {
      app.use(bodyparser())
      app.use(router.routes())
      app.use(allowedMethods())
      const server = app.listen(option)
      server.on('listening', async () => {
        let addr = (server.address() || {}) as AddressInfo
        const url =
          'http://' + [addr.address, addr.port].filter(Boolean).join(':')
        // console.log(`temp test app url: ${url}`)
        // assert.ok(url, `server url should not be empty`);
        try {
          await cb(server, url)
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
