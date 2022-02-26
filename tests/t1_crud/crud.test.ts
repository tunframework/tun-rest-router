import assert from 'assert'

import { RestifyRouter } from '../../lib/index.js'

import { prepareApp } from './boot.js'

import fetch from 'node-fetch'

describe(`t1_crud`, async () => {
  it(`#new`, () => {
    const prefix = `/${Date.now()}`
    const router = new RestifyRouter({ prefix })
    assert.equal(router._prefix, prefix, 'should accept prefix')
  })
  it(`#get`, async () => {
    const router = new RestifyRouter()
    const ts = Date.now()
    const pathname = `/test`
    router.get(pathname, async (ctx, next) => {
      return ts
    })

    const result = await router.routes()(
      {
        // @ts-ignore
        req: {
          path: pathname,
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
    const ts = Date.now()
    const pathname = `/ts/:ts`
    const pathname4Request = `/ts/${ts}`
    const data = {
      ts,
      noise: Math.random()
    }
    router.post(pathname, async (ctx, next) => {
      // return ctx.req.body;

      // ctx.res.body = {
      //   slug: ctx.req.slugs.ts,
      //   data: ctx.req.body,
      // };
      // await next();

      return {
        slug: ctx.req.slugs.ts,
        data: ctx.req.body
      }
    })

    boot(async (server, url) => {
      const res = await fetch(`${url}${pathname4Request}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result: any = await res.json()

      try {
        assert.ok(result, `should return result`)
        assert.strictEqual(
          result.slug,
          String(ts),
          `should return expected slug value`
        )
        assert.deepEqual(result.data, data, `should return expected data`)
        done()
      } catch (error) {
        done(error)
      }
    })
  })
})
