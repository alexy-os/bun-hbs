import Handlebars from 'handlebars';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, resolve } from 'path';
import { CONFIG } from './config';
const hbs = Handlebars.create(); // Initialize Handlebars
const templateCache = {}; // Cache for templates
const partialCache = {}; // Cache for partials
let isCachingEnabled = true; // Flag for caching
let cacheTTL = 300000; // 5 minutes in milliseconds
class TemplateError extends Error {
    templateName;
    constructor(message, templateName) {
        super(message);
        this.templateName = templateName;
        this.name = 'TemplateError'; // Custom error name
    }
}
function log(message, level = 'info') {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(CONFIG.LOG_LEVEL)) {
        console[level](message); // Log message based on level
    }
}
async function safeReadTemplate(templatePath) {
    const fullPath = resolve(CONFIG.VIEWS_DIR, templatePath);
    if (!fullPath.startsWith(resolve(CONFIG.VIEWS_DIR))) {
        throw new TemplateError(`Access outside of allowed directory: ${fullPath}`, templatePath);
    }
    try {
        return await readFile(fullPath, 'utf-8'); // Safely read template file
    }
    catch (error) {
        if (error instanceof Error) {
            throw new TemplateError(`Failed to read template: ${error.message}`, templatePath);
        }
        else {
            throw new TemplateError(`Failed to read template: Unknown error`, templatePath);
        }
    }
}
async function isCached(templatePath, cache) {
    const fullPath = resolve(CONFIG.VIEWS_DIR, templatePath);
    try {
        const { mtimeMs } = await stat(fullPath);
        return cache[templatePath]?.mtime === mtimeMs; // Check if template is cached
    }
    catch (error) {
        log(`Error checking cache for ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        return false;
    }
}
async function getTemplate(templatePath) {
    const fullPath = resolve(CONFIG.VIEWS_DIR, templatePath);
    const { mtimeMs } = await stat(fullPath);
    if (isCachingEnabled && templateCache[templatePath]?.mtime === mtimeMs) {
        return templateCache[templatePath].template; // Return cached template
    }
    const templateContent = await safeReadTemplate(templatePath);
    const compiledTemplate = hbs.compile(templateContent);
    templateCache[templatePath] = { template: compiledTemplate, mtime: mtimeMs }; // Cache template
    return compiledTemplate;
}
async function registerPartials(directory) {
    const files = await readdir(directory, { withFileTypes: true });
    const tasks = files.map(async (file) => {
        const fullPath = join(directory, file.name);
        if (file.isDirectory()) {
            return registerPartials(fullPath); // Recursively register partials in subdirectories
        }
        else if (extname(file.name) === '.hbs') {
            const name = file.name.replace('.hbs', '');
            try {
                const template = await safeReadTemplate(fullPath);
                const { mtimeMs } = await stat(fullPath);
                hbs.registerPartial(name, template); // Register partial
                partialCache[name] = { template, mtime: mtimeMs }; // Cache partial
            }
            catch (err) {
                log(`Error registering partial ${name}: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
            }
        }
    });
    await Promise.all(tasks);
}
export async function render(template, context = {}, layout) {
    const startTime = Date.now();
    try {
        const contentTemplate = await getTemplate(template);
        const content = contentTemplate(context);
        if (layout) {
            const layoutTemplate = await getTemplate(join(CONFIG.LAYOUTS_DIR, layout));
            const result = layoutTemplate({ ...context, body: content });
            const renderTime = Date.now() - startTime;
            log(`Template ${template} with layout ${layout} rendered in ${renderTime}ms`, 'debug');
            return result;
        }
        else {
            const renderTime = Date.now() - startTime;
            log(`Template ${template} rendered without layout in ${renderTime}ms`, 'debug');
            return content;
        }
    }
    catch (error) {
        if (error instanceof TemplateError) {
            log(`Template error in ${error.templateName}: ${error.message}`, 'error');
        }
        else if (error instanceof Error) {
            log(`Error rendering template ${template}: ${error.message}`, 'error');
        }
        else {
            log(`Unknown error rendering template ${template}`, 'error');
        }
        throw error;
    }
}
export function clearCache() {
    Object.keys(templateCache).forEach(key => delete templateCache[key]); // Clear template cache
    Object.keys(partialCache).forEach(key => delete partialCache[key]); // Clear partial cache
}
export function registerHelper(name, helper) {
    hbs.registerHelper(name, helper); // Register custom helper
}
export function setCaching(enabled) {
    isCachingEnabled = enabled; // Set caching flag
}
export function setCacheTTL(ttl) {
    cacheTTL = ttl; // Set cache TTL
}
export async function initHandlebars() {
    try {
        await registerPartials(CONFIG.PARTIALS_DIR);
        registerHelper('eq', (a, b) => a === b); // Register 'eq' helper
        registerHelper('formatDate', (date) => date.toLocaleDateString()); // Register 'formatDate' helper
        log('Template engine initialized successfully', 'info');
    }
    catch (error) {
        log(`Error initializing template engine: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
    }
}
// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection: ${reason}`, 'error');
});
process.on('uncaughtException', (err) => {
    log(`Uncaught Exception: ${err.message}`, 'error');
});
