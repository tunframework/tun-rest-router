// @ts-check

import { HttpError, HttpMethod } from '@tunframework/tun'
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

export interface RestifyRouterOption {
  prefix?: string
  methods?: Array<keyof typeof HttpMethod>
}

export class RestifyRouter {
  _routes: Route[] = []
  // temp prefix, consumed in addRoute()
  _prefix = ''
  _methods?: Array<keyof typeof HttpMethod>

  constructor({ prefix = '', methods }: RestifyRouterOption = {}) {
    this.prefix(prefix)
    this._methods = methods
  }

  prefix(_prefix: string) {
    this._prefix = _prefix || ''
    return this
  }

  routes(): TunComposable<TunContext> {
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

  /**
   * Fufill response header if all middleware resolved and `ctx.status` is empty or 404(not_found).
   */
  allowedMethods(
    options: {
      throw?: boolean
      notImplemented?: () => Error
    } = {}
  ): TunComposable<TunContext> {
    const implemented: string[] = this._methods || Object.keys(HttpMethod)

    return async function allowedMethods(ctx, next) {
      await next()
      if (ctx.res.status || ctx.res.status !== 404) {
        return
      }

      const allowed: Record<string, string> = {}
      const matchedRoute: Route = ctx.state.matchedRoute
      if (matchedRoute) {
        matchedRoute.methods.forEach((method) => {
          allowed[method] = method
        })
      }

      const allowedArr = Object.keys(allowed)

      if (implemented.indexOf(ctx.req.method) > -1) {
        if (options.throw) {
          let throwable = null
          if (typeof options.notImplemented === 'function') {
            throwable = options.notImplemented()
          } else {
            throwable = new HttpError({ status: 501 })
          }
          throw throwable
        } else {
          ctx.res.status = 501
          ctx.res.set('Allow', allowedArr)
        }
      } else if (allowedArr.length) {
        if (ctx.req.method === 'OPTIONS') {
          ctx.res.status = 200
          ctx.body = ''
          ctx.res.set('Allow', allowedArr)
        } else if (!allowed[ctx.req.method]) {
          if (options.throw) {
            let throwable = null
            if (typeof options.notImplemented === 'function') {
              throwable = options.notImplemented()
            } else {
              throwable = new HttpError({ status: 405 })
            }
            throw throwable
          } else {
            ctx.res.status = 405
            ctx.res.set('Allow', allowedArr)
          }
        }
      }
    }
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
