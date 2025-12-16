# AGENTS.md - Figma Plugin Development Guide

## Project Overview
This document provides AI assistants with essential context for helping with Figma plugin development using **create-figma-plugin** toolkit.

## Project Type
Figma Plugin Development (using create-figma-plugin)

## Technology Stack
- **Framework**: [create-figma-plugin](https://yuanqing.github.io/create-figma-plugin/)
- **Runtime**: Figma Plugin API
- **UI Library**: Preact (not React!)
- **Languages**: TypeScript
- **Build Tool**: esbuild (via create-figma-plugin)
- **Package Manager**: npm

## Why create-figma-plugin?
- Sub-second build times with esbuild
- Pre-built Preact UI components matching Figma's design system
- Automatic manifest generation from package.json
- Built-in utilities for main/UI communication
- Hot reloading during development

## Project Structure (create-figma-plugin)
```
figma-plugin/
├── src/
│   ├── main.ts           # Main plugin logic (sandbox context)
│   ├── ui.tsx            # UI implementation (Preact components)
│   └── types.ts          # Shared TypeScript types
├── package.json          # Plugin config + dependencies
├── tsconfig.json         # TypeScript configuration
└── node_modules/         # Dependencies
```

**Key differences from vanilla Figma plugins:**
- No `manifest.json` file (auto-generated from `package.json`)
- No separate `code.ts` and `ui.html` files
- UI is written in `.tsx` files with Preact, not HTML
- Configuration lives in `package.json`

## Configuration (package.json)

Plugin configuration is defined in `package.json` under the `"figma-plugin"` key:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "figma-plugin": {
    "id": "1234567890123456789",
    "name": "My Plugin",
    "main": "src/main.ts",
    "ui": "src/ui.tsx",
    "menu": [
      {
        "name": "Command Name",
        "main": "src/main.ts",
        "ui": "src/ui.tsx"
      }
    ]
  }
}
```

## Key Concepts

### Main Context (src/main.ts)
Runs in Figma's sandbox, has access to Figma API:

```typescript
import { once, showUI } from '@create-figma-plugin/utilities';

export default function () {
  // Show UI
  showUI({ width: 300, height: 200 });

  // Listen for messages from UI
  once('CREATE_RECTANGLES', function (count: number) {
    for (let i = 0; i < count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      figma.currentPage.appendChild(rect);
    }
    figma.closePlugin('Created rectangles!');
  });
}
```

### UI Context (src/ui.tsx)
Preact components rendered in iframe:

```typescript
import { emit } from '@create-figma-plugin/utilities';
import { Button, Container, TextboxNumeric, VerticalSpace } from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useState } from 'preact/hooks';

function Plugin() {
  const [count, setCount] = useState(5);

  function handleCreateClick() {
    emit('CREATE_RECTANGLES', count);
  }

  return (
    <Container space="medium">
      <VerticalSpace space="small" />
      <TextboxNumeric
        value={count}
        onValueInput={setCount}
        variant="border"
      />
      <VerticalSpace space="small" />
      <Button fullWidth onClick={handleCreateClick}>
        Create Rectangles
      </Button>
    </Container>
  );
}

export default render(Plugin);
```

### Communication Between Contexts

**Main → UI:**
```typescript
// main.ts
import { emit } from '@create-figma-plugin/utilities';
emit('SELECTION_CHANGED', figma.currentPage.selection);
```

**UI → Main:**
```typescript
// ui.tsx
import { on } from '@create-figma-plugin/utilities';
on('SELECTION_CHANGED', (selection) => {
  console.log('Selection:', selection);
});
```

## Available UI Components

create-figma-plugin provides Preact components that match Figma's design:

- Layout: `Container`, `VerticalSpace`, `MiddleAlign`
- Inputs: `Textbox`, `TextboxNumeric`, `TextboxMultiline`, `Dropdown`, `SearchTextbox`
- Buttons: `Button`, `IconButton`, `LoadingIndicator`
- Selection: `Checkbox`, `RadioButtons`, `SegmentedControl`, `Toggle`
- Display: `Banner`, `Text`, `Preview`, `Icon`
- Advanced: `Tabs`, `FileUploadButton`, `Layer`

Import from `@create-figma-plugin/ui`:
```typescript
import { Button, Textbox, VerticalSpace } from '@create-figma-plugin/ui';
```

## Common Utilities

```typescript
import {
  emit,              // Send message from main/UI
  on,                // Listen for messages
  once,              // Listen once for message
  showUI,            // Display plugin UI
  loadSettingsAsync, // Load plugin settings
  saveSettingsAsync  // Save plugin settings
} from '@create-figma-plugin/utilities';
```

## Development Workflow

### Setup
```bash
npm install                    # Install dependencies
```

### Development Commands
```bash
npm run build                  # Build plugin once
npm run watch                  # Build + watch for changes
```

### Testing
1. Build or watch the plugin
2. In Figma Desktop: Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file in your project root (auto-generated)
4. Run your plugin from Plugins → Development → [Your Plugin Name]

### Hot Reload
When `npm run watch` is running, changes auto-rebuild. Just re-run the plugin in Figma to see updates.

## TypeScript Types

Define shared types in `src/types.ts`:

```typescript
export interface CreateRectanglesMessage {
  count: number;
}

export interface SelectionChangedMessage {
  nodeIds: string[];
}
```

Use in event handlers:

```typescript
// main.ts
import { CreateRectanglesMessage } from './types';

once<CreateRectanglesMessage>('CREATE_RECTANGLES', (msg) => {
  // msg.count is typed
});
```

## Best Practices

1. **Use Preact, not React**: create-figma-plugin uses Preact. Don't import from 'react'
2. **Type your events**: Define message types for type-safe communication
3. **Use built-in components**: Leverage @create-figma-plugin/ui for consistent UI
4. **Configure in package.json**: All plugin metadata goes in `figma-plugin` field
5. **Multiple commands**: Use the `menu` array for multiple plugin commands
6. **Settings persistence**: Use `loadSettingsAsync`/`saveSettingsAsync` for user preferences

## Common Patterns

### Multiple Commands
```json
{
  "figma-plugin": {
    "menu": [
      {
        "name": "Create Shapes",
        "main": "src/commands/create-shapes/main.ts",
        "ui": "src/commands/create-shapes/ui.tsx"
      },
      {
        "name": "Export Data",
        "main": "src/commands/export-data/main.ts"
      }
    ]
  }
}
```

### Loading State
```typescript
import { useState } from 'preact/hooks';
import { Button, LoadingIndicator } from '@create-figma-plugin/ui';

function Plugin() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    emit('DO_SOMETHING');
  }

  return loading ? <LoadingIndicator /> : <Button onClick={handleClick}>Go</Button>;
}
```

### Persistent Settings
```typescript
import { loadSettingsAsync, saveSettingsAsync } from '@create-figma-plugin/utilities';

interface Settings {
  lastCount: number;
}

export default function () {
  loadSettingsAsync<Settings>({ lastCount: 5 }).then((settings) => {
    console.log('Last count:', settings.lastCount);
  });

  once('SAVE_COUNT', (count: number) => {
    saveSettingsAsync({ lastCount: count });
  });
}
```

## Troubleshooting

### Build Errors
- Ensure TypeScript is installed: `npm install --save-dev typescript`
- Check `tsconfig.json` matches create-figma-plugin requirements
- Delete `node_modules` and reinstall if dependency issues occur

### UI Not Showing
- Verify `showUI()` is called in main.ts
- Check console for errors: Plugins → Development → Open Console
- Ensure UI file path in package.json is correct

### Communication Issues
- Use same event name in `emit()` and `on()`/`once()`
- Verify types match between main and UI contexts
- Check console in both main (Figma console) and UI (browser DevTools)

## Documentation Resources
- [create-figma-plugin docs](https://yuanqing.github.io/create-figma-plugin/)
- [UI Components Storybook](https://yuanqing.github.io/create-figma-plugin/storybook/)
- [Figma Plugin API Reference](https://www.figma.com/plugin-docs/)
- [Reference Plugins](https://yuanqing.github.io/create-figma-plugin/reference-plugins-and-widgets/)

## Example Repository
A good reference implementation: [tidy-release-notes](https://github.com/tidy-dev-team/tidy-release-notes)

## Plugin-Specific Notes
[Add project-specific implementation details, custom utilities, or architectural decisions here]

---

*Last Updated: December 2024*
*create-figma-plugin version: Check package.json for current version*