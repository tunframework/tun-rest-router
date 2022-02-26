// @ts-check
import { matchRoute, pathToRegexp } from './route-utils.js';
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
    _routes = [];
    // temp prefix, consumed in addRoute()
    _prefix = '';
    constructor({ prefix = '' } = {}) {
        this.prefix(prefix);
    }
    prefix(_prefix) {
        this._prefix = _prefix || '';
        return this;
    }
    routes() {
        // return this._routes;
        return (ctx, next) => {
            let route = matchRoute(ctx.req.method, ctx.req.path, this._routes);
            if (!route) {
                return next();
            }
            ctx.state.matchedRoute = route;
            if (ctx.res.status === 404) {
                ctx.res.status = 200;
            }
            let slugs = route.slugNames.reduce((p, n, nIndex) => {
                p[n] = route.slugValues[nIndex];
                return p;
            }, {});
            ctx.req.slugs = slugs;
            return route.handler.call(null, ctx, next);
        };
    }
    addRoute(methods, pathname, handler) {
        this._routes.push({
            // ...pathToRegexp(pathname),
            ...pathToRegexp((this._prefix || '') + pathname),
            methods: Array.isArray(methods) ? methods : [methods],
            slugValues: [],
            handler
        });
        return this;
    }
    get(pathname, handler) {
        return this.addRoute('GET', pathname, handler);
    }
    head(pathname, handler) {
        return this.addRoute('HEAD', pathname, handler);
    }
    post(pathname, handler) {
        return this.addRoute('POST', pathname, handler);
    }
    put(pathname, handler) {
        return this.addRoute('PUT', pathname, handler);
    }
    delete(pathname, handler) {
        return this.addRoute('DELETE', pathname, handler);
    }
    // connect(pathname: string, handler: TunComposable<TunContext>) {
    //     return this.addRoute('CONNECT', pathname, handler);
    // }
    options(pathname, handler) {
        return this.addRoute('OPTIONS', pathname, handler);
    }
    // trace(pathname: string, handler: TunComposable<TunContext>) {
    //     return this.addRoute('TRACE', pathname, handler);
    // }
    patch(pathname, handler) {
        return this.addRoute('PATCH', pathname, handler);
    }
}
export let loadRestifyRoutes = async (pathname) => {
    let M = await import(pathname);
    let list = Object.keys(M)
        .filter((k) => M[k] instanceof RestifyRouter)
        .map((k) => M[k]);
    if (list.length === 1) {
        return list[0];
    }
    // compose
    let r = new RestifyRouter();
    for (const item of list) {
        r._routes.push(...item._routes);
    }
    return r;
};
