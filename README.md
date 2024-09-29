# bun-hbs

Library for integrating Handlebars templates into BunJs.

## Installation

```bash
bun add bun-hbs
```

## Usage

```typescript
import { setConfig, initHandlebars, render } from 'bun-hbs';
import { join } from 'path';

// Configuring the configuration
setConfig({
  VIEWS_DIR: join(__dirname, 'views'),
  PARTIALS_DIR: join(__dirname, 'views/partials'),
  LAYOUTS_DIR: join(__dirname, 'views/layouts'),
  LOG_LEVEL: 'debug'
});

// Initializing the template engine
await initHandlebars();

// Rendering a template
const result = await render('home.hbs', { title: 'Home' }, 'main.hbs');
console.log(result);
```

## API

- `setConfig(config: Partial<Config>)`: Sets the engine configuration.
- `initHandlebars()`: Initializes the template engine.
- `render(template: string, context?: object, layout?: string)`: Renders a template with the specified context and layout.
- `clearCache()`: Clears the template cache.
- `registerHelper(name: string, helper: Function)`: Registers a custom helper.
- `setCaching(enabled: boolean)`: Enables or disables caching.
- `setCacheTTL(ttl: number)`: Sets the cache TTL.

## License

MIT