# @kitiumai/dev-setup

Enterprise-ready development environment setup CLI for KitiumAI projects, powered by latest @kitiumai packages.

[![npm version](https://img.shields.io/npm/v/@kitiumai/dev-setup)](https://www.npmjs.com/package/@kitiumai/dev-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

🚀 **Automated Setup** - Automatically detect OS and install required development tools with idempotent checks
🛡️ **Preflight Assurance** - Disk, privilege, and network preflight checks guard against partial installs
📊 **Structured Logging** - Enterprise-grade logging with @kitiumai/logger
🔒 **Type-Safe** - Full TypeScript support with @kitiumai/types
✅ **Validated** - Runtime validation using @kitiumai/utils-ts
⚙️ **Configurable** - Skip tools, editors, block/allow lists, dry-run previews, or run in interactive mode
🧪 **Well-Tested** - Comprehensive unit test coverage

## Installation

```bash
npm install -g @kitiumai/dev-setup
```

Or use directly with npx:

```bash
npx @kitiumai/dev-setup
```

## Quick Start

### Basic Setup

```bash
dev-setup
```

### With Options

```bash
# Enable verbose logging
dev-setup --verbose

# Skip specific tools
dev-setup --skip-tools python,graphviz

# Skip specific editors
dev-setup --skip-editors cursor,antigravity

# Interactive mode
dev-setup --interactive

# Dry-run mode with retry tuning
dev-setup --dry-run --max-retries 2

# Enforce allow/block policies
dev-setup --allow git,node --block cursor
```

## Usage

### CLI Commands

The `dev-setup` command sets up your development environment by:

1. **Detecting Operating System** - Identifies Windows, macOS, or Linux
2. **Checking Package Manager** - Validates Chocolatey (Windows), Homebrew (macOS), or APT (Linux)
3. **Installing Core Tools** - Git, Node.js, GraphViz, Python
4. **Installing Editors** - VSCode, Cursor, Antigravity IDE
5. **Configuring Node.js** - Enables Corepack for package manager management

### Options

#### `-v, --verbose`

Enable verbose logging output with detailed error messages and context.

```bash
dev-setup --verbose
```

#### `--skip-tools <tools>`

Skip specific tools during installation (comma-separated list).

Available tools: `git`, `node`, `graphviz`, `python`

```bash
dev-setup --skip-tools python,graphviz
```

#### `--skip-editors <editors>`

Skip specific editors during installation (comma-separated list).

Available editors: `vscode`, `cursor`, `antigravity`

```bash
dev-setup --skip-editors cursor,antigravity
```

#### `--interactive`

Run in interactive mode (future enhancement).

```bash
dev-setup --interactive
```

## API Documentation

### Types

#### `DevTool` Enum

Available development tools:

```typescript
export enum DevTool {
  Git = 'git',
  Node = 'node',
  GraphViz = 'graphviz',
  Python = 'python',
}
```

#### `Editor` Enum

Available editors/IDEs:

```typescript
export enum Editor {
  VSCode = 'vscode',
  Cursor = 'cursor',
  Antigravity = 'antigravity',
}
```

#### `SetupConfig` Interface

Configuration options for setup:

```typescript
interface SetupConfig {
  skipTools?: DevTool[];
  skipEditors?: Editor[];
  interactive?: boolean;
  verbose?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  dryRun?: boolean;
  allowlist?: (DevTool | Editor)[];
  blocklist?: (DevTool | Editor)[];
  telemetry?: boolean;
  maxRetries?: number;
}
```

#### `SetupContext` Interface

Runtime context for setup session:

```typescript
interface SetupContext {
  platform: OperatingSystem;
  packageManager?: PackageManager;
  installedTools: Set<DevTool>;
  installedEditors: Set<Editor>;
  taskResults: SetupTaskResult[];
}
```

#### `SetupError` Class

Custom error class with context information:

```typescript
class SetupError extends Error {
  constructor(
    message: string,
    tool?: DevTool | Editor,
    platform?: OperatingSystem,
    command?: string[]
  );
}
```

### Utility Functions

#### `detectOperatingSystem()`

Detect the current operating system.

```typescript
const os = detectOperatingSystem();
// Returns: 'win32' | 'darwin' | 'linux'
```

#### `getPackageManager(platform)`

Get the appropriate package manager for the platform.

```typescript
const manager = getPackageManager('darwin');
// Returns: 'homebrew' | 'chocolatey' | 'apt' | 'winget' | 'scoop' | 'yum' | 'zypper' | 'pacman' | undefined
```

#### `detectPackageManagerAvailability(platform)`

Return a set of detected package managers for the current OS.

```typescript
const managers = detectPackageManagerAvailability('linux');
// Returns: Set<'apt' | 'yum' | 'zypper' | 'pacman'>
```

#### `createSetupContext()`

Create a new setup context with initialized state.

```typescript
const context = createSetupContext();
// Returns: SetupContext
```

#### `runPreflightChecks()`

Perform privilege, disk, and network reachability checks.

```typescript
const preflight = await runPreflightChecks();
// Returns: { hasSudo: boolean; diskSpaceMb?: number; networkReachable: boolean; warnings: string[] }
```

#### `validateSetupContext(context)`

Runtime validation of setup context.

```typescript
const isValid = validateSetupContext(context);
// Returns: boolean
```

#### `getPackageManagerInstruction(platform)`

Get installation instructions for a package manager.

```typescript
const instruction = getPackageManagerInstruction('win32');
// Returns: { name: string; command: string; url: string } | undefined
```

#### `formatErrorMessage(error, tool?, platform?)`

Format error messages with optional context.

```typescript
const message = formatErrorMessage(error, DevTool.Git, 'win32');
// Returns: formatted error string
```

#### `safeExecuteCommand(fn, fallback, options?)`

Execute an async command with retries and dry-run support.

```typescript
await safeExecuteCommand(
  () => execa('brew', ['install', 'git']),
  false,
  { retries: 2, backoffMs: 500, commandLabel: 'git install' }
);
```

#### `groupToolsByPriority(tools)`

Group tools into essential and optional categories.

```typescript
const grouped = groupToolsByPriority([DevTool.Git, DevTool.Python]);
// Returns: { essential: DevTool[], optional: DevTool[] }
```

## Examples

### Programmatic Usage

```typescript
import {
  createSetupContext,
  detectOperatingSystem,
  getPackageManager,
  validateSetupContext,
  runPreflightChecks,
} from '@kitiumai/dev-setup';
import { createLogger } from '@kitiumai/logger';

const logger = createLogger('my-setup');

// Create setup context
const context = createSetupContext();

// Validate
if (!validateSetupContext(context)) {
  logger.error('Invalid setup context');
  process.exit(1);
}

// Preflight checks
const preflight = await runPreflightChecks();
if (preflight.warnings.length) {
  logger.warn({ preflight }, 'Preflight warnings detected');
}

// Get platform info
const platform = detectOperatingSystem();
const manager = getPackageManager(platform);

logger.info('Setup context created', { platform, manager });
```

### CLI with Logging

The CLI automatically logs all operations:

```bash
$ dev-setup --verbose
🚀 Starting KitiumAI Development Environment Setup

✓ Preflight Checks
✓ Check Operating System
✓ Check Package Manager
✓ Install Core Tools
✓ Install Editors
  ✓ VSCode
  ✓ Cursor
  ✗ Antigravity (skipped)
✓ Setup Node.js Tools

✅ Setup complete!

Setup Summary:
  Platform: darwin
  Package Manager: homebrew
  Installed Editors: vscode, cursor
```

## Integration with @kitiumai Packages

### @kitiumai/logger

Structured logging with full context management:

```typescript
import { createLogger } from '@kitiumai/logger';

const logger = createLogger('dev-setup');
logger.info('Setup started', { timestamp: new Date() });
```

### @kitiumai/types

Type-safe configuration and domain models:

```typescript
import { DevTool, Editor, type SetupConfig } from '@kitiumai/dev-setup';
```

### @kitiumai/utils-ts

Validation and utility functions:

```typescript
import { isString, isNil } from '@kitiumai/utils-ts';
```

### @kitiumai/lint

Enforced code quality and linting:

- ESLint configuration with security rules
- Prettier formatting standards
- TypeScript strict mode

### @kitiumai/config

Shared configuration presets:

- ESLint base configuration
- Jest and Vitest configurations
- TypeScript compiler options

## Testing

Run comprehensive unit tests:

```bash
npm test
```

Test coverage includes:

- ✅ OS detection for all platforms
- ✅ Package manager selection
- ✅ Setup context validation
- ✅ Error message formatting
- ✅ Tool prioritization
- ✅ Integration scenarios
- ✅ Type validation

## Development

### Scripts

```bash
# Build TypeScript
npm run build

# Watch mode
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format:fix

# Type checking
npm run typecheck

# Run tests
npm test

# Watch tests
npm run test:watch
```

### Project Structure

```
src/
├── index.ts           # CLI entry point
├── types.ts          # Type definitions
├── utils.ts          # Utility functions
└── __tests__/        # Unit tests
    ├── types.test.ts
    └── utils.test.ts

bin/
└── dev-setup.js      # Executable entry point

dist/                 # Compiled output
```

## Architecture

### Clean Architecture

- **Types Layer** - Type definitions and enums
- **Utils Layer** - Pure functions and validation
- **CLI Layer** - Command interface and task orchestration
- **Logging Layer** - Structured logging with @kitiumai/logger

### Design Principles

- ✅ Single Responsibility
- ✅ Open/Closed Principle
- ✅ Liskov Substitution
- ✅ Interface Segregation
- ✅ Dependency Inversion

## Troubleshooting

### Issue: "Cannot find module '@kitiumai/logger'"

**Solution:** Install dependencies

```bash
npm install
```

### Issue: "Chocolatey/Homebrew not found"

**Solution:** Install the package manager manually

- **Windows:** https://chocolatey.org/install
- **macOS:** https://brew.sh

### Issue: Permission denied on Linux

**Solution:** Use `sudo` for installation

```bash
sudo dev-setup
```

### Issue: Tests fail with "vitest not found"

**Solution:** Install dev dependencies

```bash
npm install --save-dev vitest
```

## Migration Guide

See [MIGRATION.md](./MIGRATION.md) for detailed migration information from v0.0.1 to v1.0.0.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Write clean, well-documented code
2. Follow TypeScript and linting standards
3. Add tests for new features
4. Update documentation
5. Follow the commit message convention

## License

MIT © [Kitium AI](https://kitiumai.com)

## Support

For issues, questions, or suggestions:

1. Check the [MIGRATION.md](./MIGRATION.md) guide
2. Review inline code documentation
3. Check [@kitiumai packages documentation](https://github.com/kitium-ai)
4. Open an issue in the repository

## Changelog

### v1.0.0

- ✨ Complete refactor using latest @kitiumai packages
- ✨ Structured logging with @kitiumai/logger
- ✨ Type-safe configuration with @kitiumai/types
- ✨ Validation utilities from @kitiumai/utils-ts
- ✨ Comprehensive unit tests
- ✨ ESLint and Prettier configuration
- ✨ CLI options: --verbose, --skip-tools, --skip-editors, --interactive
- 🔧 Improved error handling with SetupError
- 🔧 Better task result tracking
- 📚 Complete API documentation

### v0.0.1

- Initial release with basic OS and tool detection
