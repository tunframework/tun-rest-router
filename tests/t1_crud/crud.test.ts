import assert from 'assert'

import { RestifyRouter } from '../../lib/index.js'

import { prepareApp } from './boot.js'

describe(`t1_crud`, async () => {
  it(`#new`, () => {
    const prefix = `/${Date.now()}`
    const router = new RestifyRouter({ prefix })
    assert.equal(router._prefix, prefix, 'should accept prefix')
  })
  it(`#get`, async () => {
    const router = new RestifyRouter()
    const ts = Date.now()
    const path = `/test`
    router.get(path, async (ctx, next) => {
      return ts
    })

    const result = await router.routes()(
      {
        // @ts-ignore
        req: {
          path,
          method: 'GET'
        },
        // @ts-ignore
        res: {}
      },
      null
    )
    assert.equal(result, ts, `should return expected data`)
  })

  it(`#post`, (done) => {
    const { router, boot } = prepareApp()
    boot((server) => {
      done()
    })
  })
})
