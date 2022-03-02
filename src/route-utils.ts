import { HttpMethod } from '@tunframework/tun'
import { HttpError } from '@tunframework/tun'
import { TunComposable, TunContext } from '@tunframework/tun'

export interface Route {
  methods: Array<keyof typeof HttpMethod>
  pathname: string
  re: RegExp
  slugNames: string[]
  slugValues: string[]
  slugPositions: number[]
  handler: TunComposable<TunContext>
}

export function parseControllers2Routes(
  controllers: Record<string, TunComposable<TunContext>>[]
) {
  const _routes: Route[] = []

  for (const controller of controllers) {
    const pathAndMethodList = Object.getOwnPropertyNames(controller).filter(
      (item) => typeof controller[item] === 'function'
    )
    for (const pathAndMethod of pathAndMethodList) {
      let [method, pathname] = pathAndMethod.split(' ')

      if (!pathname) {
        pathname = method
        method = 'GET'
        console.warn(
          `"${pathname}" implict method not recommanded, curently resolved as "GET"`
        )
      }

      if (!pathname) {
        throw new Error(`"${pathAndMethod}" pathname required!`)
      }
      method = method.toUpperCase()
      let methods = method.split('|') as Array<keyof typeof HttpMethod>

      let methodUnsupported = methods.find((o) => !HttpMethod[o])
      if (methodUnsupported) {
        throw new Error(`unsupported method "${methodUnsupported}"`)
      }

      if (!pathname.startsWith('/')) {
        console.warn(`"${pathname}" prefix "/" required`)
        continue
      }

      let handler = controller[pathAndMethod]
      _routes.push({
        ...pathToRegexp(pathname),
        methods,
        slugValues: [],
        handler
      })
    }
  }

  // @ts-ignore
  return _routes
}

export function assertLegalPathPartName(name: string) {
  if (!name || name.match(/^[^-0-9a-zA-Z]+$/)) {
    throw new Error(`Expect "${name}" to be legal part of path.`)
  }
}

export function pathToRegexp(pathname: string) {
  /**@type {Route} */
  let route: Route = {
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
    handler: (ctx: TunContext, next: () => Promise<any>) => next()
  }

  if (!pathname.startsWith('/')) {
    throw new Error(`Expect path "${pathname}" startsWith "/"`)
  }

  let regexp
  if (pathname === '/') {
    regexp = '^/$'
  } else {
    regexp =
      '^/' +
      pathname
        .substring(1)
        .split('/')
        .map((item, itemIndex) => {
          if (item.startsWith(':')) {
            // "/custom/:id([0-9a-zA-Z]{36})"

            let name = item.substring(1)
            let lParInd = name.indexOf('(')
            if (lParInd > -1 && name.endsWith(')')) {
              let customRegexp = name.substring(lParInd + 1, name.length - 1)
              name = name.substring(0, lParInd)

              assertLegalPathPartName(name)

              route.slugNames.push(name)
              route.slugPositions.push(itemIndex)
              return `(${customRegexp})`
            } else {
              assertLegalPathPartName(name)

              route.slugNames.push(name)
              route.slugPositions.push(itemIndex)
              return '(.+)'
            }
          } else if (item.startsWith('{') && item.endsWith('}')) {
            // "/custom/{id:[0-9a-zA-Z]{36}}"

            let kv = item.substring(1, item.length - 1)
            let [name, customRegexp] = kv.split(':', 2)
            customRegexp = customRegexp || '.+'

            assertLegalPathPartName(name)

            route.slugNames.push(name)
            route.slugPositions.push(itemIndex)
            return `(${customRegexp})`
          } else {
            // try match glob like "/custom/**/*.js"
            // let name = item.replace(/([.^$])/g, '\\$1').replace(/\*\*/g, '.*[^/]+').replace(/\*/g, '[^/]+')
            let name = item
              .replace(/([.^$])/g, '\\$1')
              .replace(/(\*+)/, ($, $1) => {
                if ($1.length === 2) {
                  return '.*[^/]+'
                } else if ($1.length === 1) {
                  return '[^/]+'
                } else {
                  throw new Error(`Expect "*" or "**" found ${$1}`)
                }
              })

            // assertLegalPathPartName(name);

            return name
          }
        })
        .join('/') +
      '([?].*)?([#].*)?$'
  }

  route.re = new RegExp(regexp)

  return route
}

export function matchRoute(
  method: string,
  pathname: string,
  routes: Route[]
): Route | null {
  // Check full-match route at first
  const fullMatched = routes.find(
    (/**@type {Route} */ item) =>
      item.methods.some((m) => m === method) &&
      item.pathname === pathname &&
      item.slugNames.length === 0
  )
  if (fullMatched) return fullMatched

  let slugValuesMap: Record<string, any> = {}

  return routes
    .filter((/**@type {Route} */ item) => {
      if (item.methods.every((m) => m !== method)) {
        return false
      }
      let matched = item.re.exec(pathname)
      if (matched) {
        slugValuesMap[item.pathname] = matched.slice(1, matched.length - 2)
        return true
      }
    })
    .reduce((pre: Route | null, next) => {
      // compare len
      if (!pre || pre.pathname.length <= next.pathname.length) {
        return {
          ...next,
          slugValues: slugValuesMap[next.pathname]
        }
      }
      return pre
    }, null)
}
