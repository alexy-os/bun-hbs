import Handlebars from 'handlebars';

interface RenderContext {
    [key: string]: any;
}
declare function render(template: string, context?: RenderContext, layout?: string): Promise<string>;
declare function clearCache(): void;
declare function registerHelper(name: string, helper: Handlebars.HelperDelegate): void;
declare function setCaching(enabled: boolean): void;
declare function setCacheTTL(ttl: number): void;
declare function initHandlebars(): Promise<void>;

/**
 * Configuration interface for the application.
 *
 * @property {string} VIEWS_DIR - Directory path for views.
 * @property {string} PARTIALS_DIR - Directory path for partials.
 * @property {string} LAYOUTS_DIR - Directory path for layouts.
 * @property {'debug' | 'info' | 'warn' | 'error'} LOG_LEVEL - Logging level for the application.
 */
interface Config {
    VIEWS_DIR: string;
    PARTIALS_DIR: string;
    LAYOUTS_DIR: string;
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}
/**
 * Sets a new configuration for the application.
 *
 * @param {Partial<Config>} newConfig - Partial configuration to be merged with the existing one.
 */
declare function setConfig(newConfig: Partial<Config>): void;

export { type Config, clearCache, initHandlebars, registerHelper, render, setCacheTTL, setCaching, setConfig };
