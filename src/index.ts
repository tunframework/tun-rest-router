// @ts-check

import { HttpMethod } from '@tunframework/tun'
import type { TunComposable, TunContext } from '@tunframework/tun'
import { matchRoute, pathToRegexp } from './route-utils.js'
import type { Route } from './route-utils.js'

/**
 * @example
 * ```js
 * // router/index.js
 * export const productRouter = new RestifyRouter('product')
 *   .get('/', (ctx, next) => `Hi, world!`)
 *   .post('/', (ctx, next) => JSON.stringify(ctx.req.body))
 *   .put('/{id}', (ctx, next) => `${ctx.req.slugs.id}`)
 *   .delete('/:id', (ctx, next) => `${ctx.req.slugs.id}`)
 * ```
 */

export class RestifyRouter {
  _routes: Route[] = []
  // temp prefix, consumed in addRoute()
  _prefix = ''

  constructor({ prefix = '' } = {}) {
    this.prefix(prefix)
  }

  prefix(_prefix: string) {
    this._prefix = _prefix || ''
    return this
  }

  routes(): TunComposable<TunContext> {
    // return this._routes;
    return (ctx, next) => {
      let route = matchRoute(ctx.req.method, ctx.req.path, this._routes)
      if (!route) {
        return next()
      }
      ctx.state.matchedRoute = route
      if (ctx.res.status === 404) {
        ctx.res.status = 200
      }

      let slugs = route.slugNames.reduce((p, n, nIndex) => {
        p[n] = route!.slugValues[nIndex]
        return p
      }, {} as Record<string, string>)

      ctx.req.slugs = slugs

      return route.handler.call(null, ctx, next)
    }
  }

  addRoute(
    methods: keyof typeof HttpMethod | Array<keyof typeof HttpMethod>,
    pathname: string,
    handler: TunComposable<TunContext>
  ) {
    this._routes.push({
      // ...pathToRegexp(pathname),
      ...pathToRegexp((this._prefix || '') + pathname),
      methods: Array.isArray(methods) ? methods : [methods],
      slugValues: [],
      handler
    })
    return this
  }

  get(pathname: string, handler: TunComposable<TunContext>) {
    return this.addRoute('GET', pathname, handler)
  }

  head(pathname: string, handler: TunComposable<TunContext>) {
    return this.addRoute('HEAD', pathname, handler)
  }

  post(pathname: string, handler: TunComposable<TunContext>) {
    return this.addRoute('POST', pathname, handler)
  }
  put(pathname: string, handler: TunComposable<TunContext>) {
    return this.addRoute('PUT', pathname, handler)
  }

  delete(pathname: string, handler: TunComposable<TunContext>) {
    return this.addRoute('DELETE', pathname, handler)
  }

  // connect(pathname: string, handler: TunComposable<TunContext>) {
  //     return this.addRoute('CONNECT', pathname, handler);
  // }

  options(pathname: string, handler: TunComposable<TunContext>) {
    return this.addRoute('OPTIONS', pathname, handler)
  }

  // trace(pathname: string, handler: TunComposable<TunContext>) {
  //     return this.addRoute('TRACE', pathname, handler);
  // }

  patch(pathname: string, handler: TunComposable<TunContext>) {
    return this.addRoute('PATCH', pathname, handler)
  }
}

export let loadRestifyRoutes = async (pathname: string) => {
  let M = await import(pathname)
  let list: RestifyRouter[] = Object.keys(M)
    .filter((k) => M[k] instanceof RestifyRouter)
    .map((k) => M[k])
  if (list.length === 1) {
    return list[0]
  }
  // compose
  let r = new RestifyRouter()
  for (const item of list) {
    r._routes.push(...item._routes)
  }
  return r
}
