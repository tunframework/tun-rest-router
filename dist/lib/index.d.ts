import { HttpMethod } from "tun";
import type { TunComposable, TunContext } from "tun";
import type { Route } from "./route-utils.js";
/**
 * // router/index.js
 * export const restifyRouter = new RestifyRouter().get(() => `Hi, world!`).post(() => ``).put('product/{id}').delete('project/:id')
 */
export declare class RestifyRouter {
    _routes: Route[];
    _prefix: string;
    constructor({ prefix }?: {
        prefix?: string | undefined;
    });
    /**
     *
     * @param {string} _prefix
     */
    prefix(_prefix: string): this;
    /**
     * @returns {TunComposable<TunContext>}
     */
    routes(): TunComposable<TunContext>;
    addRoute(methods: (keyof typeof HttpMethod) | Array<keyof typeof HttpMethod>, pathname: string, handler: TunComposable<TunContext>): this;
    get(pathname: string, handler: TunComposable<TunContext>): this;
    head(pathname: string, handler: TunComposable<TunContext>): this;
    post(pathname: string, handler: TunComposable<TunContext>): this;
    put(pathname: string, handler: TunComposable<TunContext>): this;
    delete(pathname: string, handler: TunComposable<TunContext>): this;
    options(pathname: string, handler: TunComposable<TunContext>): this;
    patch(pathname: string, handler: TunComposable<TunContext>): this;
}
export declare let loadRestifyRoutes: (pathname: string) => Promise<RestifyRouter>;
