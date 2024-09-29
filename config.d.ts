/**
 * Configuration interface for the application.
 *
 * @property {string} VIEWS_DIR - Directory path for views.
 * @property {string} PARTIALS_DIR - Directory path for partials.
 * @property {string} LAYOUTS_DIR - Directory path for layouts.
 * @property {'debug' | 'info' | 'warn' | 'error'} LOG_LEVEL - Logging level for the application.
 */
export interface Config {
    VIEWS_DIR: string;
    PARTIALS_DIR: string;
    LAYOUTS_DIR: string;
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}
/**
 * Default configuration for the application.
 */
export declare let CONFIG: Config;
/**
 * Sets a new configuration for the application.
 *
 * @param {Partial<Config>} newConfig - Partial configuration to be merged with the existing one.
 */
export declare function setConfig(newConfig: Partial<Config>): void;
