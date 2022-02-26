import { HttpMethod } from 'tun';
import { TunComposable, TunContext } from 'tun';
export interface Route {
    methods: Array<keyof typeof HttpMethod>;
    pathname: string;
    re: RegExp;
    slugNames: string[];
    slugValues: string[];
    slugPositions: number[];
    handler: TunComposable<TunContext>;
}
/**
 * 分析Controller的方法以生成相应路由
 */
export declare function parseControllers2Routes(controllers: Record<string, TunComposable<TunContext>>[]): Route[];
/**
 * 断言name是一个合法的路径部分
 *
 * @param {string} name
 */
export declare function assertLegalPathPartName(name: string): void;
/**
 * 路径转正则表达式
 *
 * @param {string} pathname
 */
export declare function pathToRegexp(pathname: string): Route;
/**
 *
 * @param {string} method one of HttpMethod
 * @param {string} pathname url
 * @param {Route[]} routes
 *
 * @returns {Route=} matched
 */
export declare function matchRoute(method: string, pathname: string, routes: Route[]): Route | null;
/**
 *
 * @param {{ methods?: string[], throw?: boolean, notImplemented?: () => Error }=} options
 *
 * @returns {TunComposable<TunContext>}
 */
export declare function allowedMethods(options?: {
    methods?: string[];
    throw?: boolean;
    notImplemented?: () => Error;
}): (ctx: TunContext, next: () => Promise<any>) => Promise<void>;
