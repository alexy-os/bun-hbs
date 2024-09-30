// src/engine.ts
import Handlebars from "handlebars";
import { readFile, readdir, stat } from "fs/promises";
import { join, extname, resolve } from "path";

// src/config.ts
var CONFIG = {
  VIEWS_DIR: "",
  PARTIALS_DIR: "",
  LAYOUTS_DIR: "",
  LOG_LEVEL: "info"
};
function setConfig(newConfig) {
  CONFIG = { ...CONFIG, ...newConfig };
}

// src/engine.ts
var hbs = Handlebars.create();
var templateCache = {};
var partialCache = {};
var isCachingEnabled = true;
var cacheTTL = 3e5;
var TemplateError = class extends Error {
  constructor(message, templateName) {
    super(message);
    this.templateName = templateName;
    this.name = "TemplateError";
  }
};
function log(message, level = "info") {
  const levels = ["debug", "info", "warn", "error"];
  if (levels.indexOf(level) >= levels.indexOf(CONFIG.LOG_LEVEL)) {
    console[level](message);
  }
}
async function safeReadTemplate(templatePath) {
  const fullPath = resolve(CONFIG.VIEWS_DIR, templatePath);
  if (!fullPath.startsWith(resolve(CONFIG.VIEWS_DIR))) {
    throw new TemplateError(`Access outside of allowed directory: ${fullPath}`, templatePath);
  }
  try {
    return await readFile(fullPath, "utf-8");
  } catch (error) {
    if (error instanceof Error) {
      throw new TemplateError(`Failed to read template: ${error.message}`, templatePath);
    } else {
      throw new TemplateError(`Failed to read template: Unknown error`, templatePath);
    }
  }
}
async function getTemplate(templatePath) {
  const fullPath = resolve(CONFIG.VIEWS_DIR, templatePath);
  const { mtimeMs } = await stat(fullPath);
  if (isCachingEnabled && templateCache[templatePath]?.mtime === mtimeMs) {
    return templateCache[templatePath].template;
  }
  const templateContent = await safeReadTemplate(templatePath);
  const compiledTemplate = hbs.compile(templateContent);
  templateCache[templatePath] = { template: compiledTemplate, mtime: mtimeMs };
  return compiledTemplate;
}
async function registerPartials(directory) {
  const files = await readdir(directory, { withFileTypes: true });
  const tasks = files.map(async (file) => {
    const fullPath = join(directory, file.name);
    if (file.isDirectory()) {
      return registerPartials(fullPath);
    } else if (extname(file.name) === ".hbs") {
      const name = file.name.replace(".hbs", "");
      try {
        const template = await safeReadTemplate(fullPath);
        const { mtimeMs } = await stat(fullPath);
        hbs.registerPartial(name, template);
        partialCache[name] = { template, mtime: mtimeMs };
      } catch (err) {
        log(`Error registering partial ${name}: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
      }
    }
  });
  await Promise.all(tasks);
}
async function render(template, context = {}, layout) {
  const startTime = Date.now();
  try {
    const contentTemplate = await getTemplate(template);
    const content = contentTemplate(context);
    if (layout) {
      const layoutTemplate = await getTemplate(join(CONFIG.LAYOUTS_DIR, layout));
      const result = layoutTemplate({ ...context, body: content });
      const renderTime = Date.now() - startTime;
      log(`Template ${template} with layout ${layout} rendered in ${renderTime}ms`, "debug");
      return result;
    } else {
      const renderTime = Date.now() - startTime;
      log(`Template ${template} rendered without layout in ${renderTime}ms`, "debug");
      return content;
    }
  } catch (error) {
    if (error instanceof TemplateError) {
      log(`Template error in ${error.templateName}: ${error.message}`, "error");
    } else if (error instanceof Error) {
      log(`Error rendering template ${template}: ${error.message}`, "error");
    } else {
      log(`Unknown error rendering template ${template}`, "error");
    }
    throw error;
  }
}
function clearCache() {
  Object.keys(templateCache).forEach((key) => delete templateCache[key]);
  Object.keys(partialCache).forEach((key) => delete partialCache[key]);
}
function registerHelper(name, helper) {
  hbs.registerHelper(name, helper);
}
function setCaching(enabled) {
  isCachingEnabled = enabled;
}
function setCacheTTL(ttl) {
  cacheTTL = ttl;
}
async function initHandlebars() {
  try {
    await registerPartials(CONFIG.PARTIALS_DIR);
    registerHelper("eq", (a, b) => a === b);
    registerHelper("formatDate", (date) => date.toLocaleDateString());
    log("Template engine initialized successfully", "info");
  } catch (error) {
    log(`Error initializing template engine: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    throw error;
  }
}
process.on("unhandledRejection", (reason, promise) => {
  log(`Unhandled Rejection: ${reason}`, "error");
});
process.on("uncaughtException", (err) => {
  log(`Uncaught Exception: ${err.message}`, "error");
});
export {
  clearCache,
  initHandlebars,
  registerHelper,
  render,
  setCacheTTL,
  setCaching,
  setConfig
};
