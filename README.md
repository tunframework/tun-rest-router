# tun-rest-router

rest router for tun

## install

```sh
npm install @tunframework/tun{,-bodyparser,-rest-router}
```

## example

```ts
import { TunApplication } from '@tunframework/tun'
import { bodyparser } from '@tunframework/tun-bodyparser'
import type { AddressInfo, ListenOptions } from 'net'
import { RestifyRouter } from '@tunframework/tun-rest-router'

const app = new TunApplication()
app.use(bodyparser())

const router = new RestifyRouter()
  .get('/', (ctx, next) => `Hi, world!`)
  .post('/', (ctx, next) => JSON.stringify(ctx.req.body))
  .put('/{id}', (ctx, next) => `${ctx.req.slugs.id}`)
  .delete('/:id', (ctx, next) => `${ctx.req.slugs.id}`)

app.use(router.routes())
app.use(router.allowedMethods())
const server = app.listen(option)

const option: ListenOptions = { host: '127.0.0.1', port: 0 }
server.on('listening', async () => {
  let addr = (server.address() || {}) as AddressInfo
  const url = 'http://' + [addr.address, addr.port].filter(Boolean).join(':')
  console.log(`listening: ${url}`)
})
```
