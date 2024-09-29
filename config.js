/**
 * Default configuration for the application.
 */
export let CONFIG = {
    VIEWS_DIR: '',
    PARTIALS_DIR: '',
    LAYOUTS_DIR: '',
    LOG_LEVEL: 'info'
};
/**
 * Sets a new configuration for the application.
 *
 * @param {Partial<Config>} newConfig - Partial configuration to be merged with the existing one.
 */
export function setConfig(newConfig) {
    CONFIG = { ...CONFIG, ...newConfig };
}
