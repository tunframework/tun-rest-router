import { HttpMethod } from "tun";
import { HttpError } from "tun";
/**
 * 分析Controller的方法以生成相应路由
 */
export function parseControllers2Routes(controllers) {
    const _routes = [];
    for (const controller of controllers) {
        const pathAndMethodList = Object.getOwnPropertyNames(controller).filter(item => typeof controller[item] === 'function');
        for (const pathAndMethod of pathAndMethodList) {
            let [method, pathname] = pathAndMethod.split(' ');
            if (!pathname) {
                pathname = method;
                method = 'GET';
                console.warn(`"${pathname}" implict method not recommanded, curently resolved as "GET"`);
            }
            if (!pathname) {
                throw new Error(`"${pathAndMethod}" pathname required!`);
            }
            ;
            method = method.toUpperCase();
            let methods = method.split('|');
            let methodUnsupported = methods.find(o => !HttpMethod[o]);
            if (methodUnsupported) {
                throw new Error(`unsupported method "${methodUnsupported}"`);
            }
            if (!pathname.startsWith('/')) {
                console.warn(`"${pathname}" prefix "/" required`);
                continue;
            }
            let handler = controller[pathAndMethod];
            _routes.push({
                ...pathToRegexp(pathname),
                methods,
                slugValues: [],
                handler,
            });
        }
    }
    // @ts-ignore
    return _routes;
}
/**
 * 断言name是一个合法的路径部分
 *
 * @param {string} name
 */
export function assertLegalPathPartName(name) {
    if (!name || name.match(/^[^-0-9a-zA-Z]+$/)) {
        throw new Error(`Expect "${name}" to be legal part of path.`);
    }
}
/**
 * 路径转正则表达式
 *
 * @param {string} pathname
 */
export function pathToRegexp(pathname) {
    /**@type {Route} */
    let route = {
        methods: ['GET'],
        pathname,
        re: new RegExp('^/$'),
        // /a/b/c
        // /a/b/:c([A-Za-z0-9]+)
        // /a/b/{c:[A-Za-z0-9]+}
        // /p?ttern
        slugNames: [],
        slugValues: [],
        slugPositions: [],
        handler: (ctx, next) => next(),
    };
    if (!pathname.startsWith('/')) {
        throw new Error(`Expect path "${pathname}" startsWith "/"`);
    }
    let regexp;
    if (pathname === '/') {
        regexp = '^/$';
    }
    else {
        regexp = '^/' + pathname.substring(1).split('/').map((item, itemIndex) => {
            if (item.startsWith(':')) {
                // "/custom/:id([0-9a-zA-Z]{36})"
                let name = item.substring(1);
                let lParInd = name.indexOf('(');
                if (lParInd > -1 && name.endsWith(')')) {
                    let customRegexp = name.substring(lParInd + 1, name.length - 1);
                    name = name.substring(0, lParInd);
                    assertLegalPathPartName(name);
                    route.slugNames.push(name);
                    route.slugPositions.push(itemIndex);
                    return `(${customRegexp})`;
                }
                else {
                    assertLegalPathPartName(name);
                    route.slugNames.push(name);
                    route.slugPositions.push(itemIndex);
                    return '(.+)';
                }
            }
            else if (item.startsWith('{') && item.endsWith('}')) {
                // "/custom/{id:[0-9a-zA-Z]{36}}"
                let kv = item.substring(1, item.length - 1);
                let [name, customRegexp] = kv.split(':', 2);
                customRegexp = customRegexp || '.+';
                assertLegalPathPartName(name);
                route.slugNames.push(name);
                route.slugPositions.push(itemIndex);
                return `(${customRegexp})`;
            }
            else {
                // try match glob like "/custom/**/*.js"
                // let name = item.replace(/([.^$])/g, '\\$1').replace(/\*\*/g, '.*[^/]+').replace(/\*/g, '[^/]+')
                let name = item.replace(/([.^$])/g, '\\$1').replace(/(\*+)/, ($, $1) => {
                    if ($1.length === 2) {
                        return '.*[^/]+';
                    }
                    else if ($1.length === 1) {
                        return '[^/]+';
                    }
                    else {
                        throw new Error(`Expect "*" or "**" found ${$1}`);
                    }
                });
                // assertLegalPathPartName(name);
                return name;
            }
        }).join('/') + '([?].*)?([#].*)?$';
    }
    route.re = new RegExp(regexp);
    return route;
}
/**
 *
 * @param {string} method one of HttpMethod
 * @param {string} pathname url
 * @param {Route[]} routes
 *
 * @returns {Route=} matched
 */
export function matchRoute(method, pathname, routes) {
    // 优先判断有无全匹配的路由
    const fullMatched = routes.find((/**@type {Route} */ item) => item.methods.some(m => m === method) && item.pathname === pathname && item.slugNames.length === 0);
    if (fullMatched)
        return fullMatched;
    let slugValuesMap = {};
    return routes.filter((/**@type {Route} */ item) => {
        if (item.methods.every(m => m !== method)) {
            return false;
        }
        let matched = item.re.exec(pathname);
        if (matched) {
            slugValuesMap[item.pathname] = matched.slice(1, matched.length - 2);
            return true;
        }
    }).reduce((pre, next) => {
        // compare len
        if (!pre || pre.pathname.length <= next.pathname.length) {
            return {
                ...next,
                slugValues: slugValuesMap[next.pathname],
            };
        }
        return pre;
    }, null);
}
// https://www.jianshu.com/p/fef91266a44c
// allowedMethods处理的业务是当所有路由中间件执行完成之后,若ctx.status为空或者404的时候,丰富response对象的header头
/**
 *
 * @param {{ methods?: string[], throw?: boolean, notImplemented?: () => Error }=} options
 *
 * @returns {TunComposable<TunContext>}
 */
export function allowedMethods(options = {}) {
    // /**@type {Array<keyof httpMethodMap>} */
    /**@type {string[]} */
    const implemented = options.methods || Object.keys(HttpMethod);
    return async function allowedMethods(ctx, next) {
        await next();
        if (ctx.res.status || ctx.res.status !== 404) {
            return;
        }
        // 响应状态没有设置，或为404
        const allowed = {};
        (ctx.req.matchedRoutes || []).forEach(route => {
            route.methods.forEach(method => {
                allowed[method] = method;
            });
        });
        const allowedArr = Object.keys(allowed);
        if (implemented.indexOf(ctx.req.method) > -1) {
            if (options.throw) {
                let throwable = null;
                if (typeof options.notImplemented === 'function') {
                    throwable = options.notImplemented();
                }
                else {
                    throwable = new HttpError({ status: 501 });
                }
                throw throwable;
            }
            else {
                ctx.res.status = 501;
                ctx.res.set('Allow', allowedArr);
            }
        }
        else if (allowedArr.length) {
            if (ctx.req.method === 'OPTIONS') {
                ctx.res.status = 200;
                ctx.body = '';
                ctx.res.set('Allow', allowedArr);
            }
            else if (!allowed[ctx.req.method]) {
                if (options.throw) {
                    let throwable = null;
                    if (typeof options.notImplemented === 'function') {
                        throwable = options.notImplemented();
                    }
                    else {
                        throwable = new HttpError({ status: 405 });
                    }
                    throw throwable;
                }
                else {
                    ctx.res.status = 405;
                    ctx.res.set('Allow', allowedArr);
                }
            }
        }
    };
}
