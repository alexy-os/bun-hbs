"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  clearCache: () => clearCache,
  initHandlebars: () => initHandlebars,
  registerHelper: () => registerHelper,
  render: () => render,
  setCacheTTL: () => setCacheTTL,
  setCaching: () => setCaching,
  setConfig: () => setConfig
});
module.exports = __toCommonJS(src_exports);

// src/engine.ts
var import_handlebars = __toESM(require("handlebars"));
var import_promises = require("fs/promises");
var import_path = require("path");

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
var hbs = import_handlebars.default.create();
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
  const fullPath = (0, import_path.resolve)(CONFIG.VIEWS_DIR, templatePath);
  if (!fullPath.startsWith((0, import_path.resolve)(CONFIG.VIEWS_DIR))) {
    throw new TemplateError(`Access outside of allowed directory: ${fullPath}`, templatePath);
  }
  try {
    return await (0, import_promises.readFile)(fullPath, "utf-8");
  } catch (error) {
    if (error instanceof Error) {
      throw new TemplateError(`Failed to read template: ${error.message}`, templatePath);
    } else {
      throw new TemplateError(`Failed to read template: Unknown error`, templatePath);
    }
  }
}
async function getTemplate(templatePath) {
  const fullPath = (0, import_path.resolve)(CONFIG.VIEWS_DIR, templatePath);
  const { mtimeMs } = await (0, import_promises.stat)(fullPath);
  if (isCachingEnabled && templateCache[templatePath]?.mtime === mtimeMs) {
    return templateCache[templatePath].template;
  }
  const templateContent = await safeReadTemplate(templatePath);
  const compiledTemplate = hbs.compile(templateContent);
  templateCache[templatePath] = { template: compiledTemplate, mtime: mtimeMs };
  return compiledTemplate;
}
async function registerPartials(directory) {
  const files = await (0, import_promises.readdir)(directory, { withFileTypes: true });
  const tasks = files.map(async (file) => {
    const fullPath = (0, import_path.join)(directory, file.name);
    if (file.isDirectory()) {
      return registerPartials(fullPath);
    } else if ((0, import_path.extname)(file.name) === ".hbs") {
      const name = file.name.replace(".hbs", "");
      try {
        const template = await safeReadTemplate(fullPath);
        const { mtimeMs } = await (0, import_promises.stat)(fullPath);
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
      const layoutTemplate = await getTemplate((0, import_path.join)(CONFIG.LAYOUTS_DIR, layout));
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearCache,
  initHandlebars,
  registerHelper,
  render,
  setCacheTTL,
  setCaching,
  setConfig
});
