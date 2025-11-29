# Dev-Setup Migration Guide: v1.0.0

This document outlines the migration from the original dev-setup implementation to v1.0.0, which uses the latest APIs from @kitiumai packages.

## Overview of Changes

The dev-setup package has been completely refactored to leverage enterprise-grade tooling from the @kitiumai ecosystem:

- **@kitiumai/logger** - Structured logging with full context management
- **@kitiumai/types** - Type-safe configuration and setup options
- **@kitiumai/utils-ts** - Validated utility functions for OS and tool detection
- **@kitiumai/lint** - Updated ESLint configuration with better rules
- **@kitiumai/config** - Shared configuration presets

## New Features

### 1. Structured Logging

All operations now use the enterprise logger from `@kitiumai/logger`:

```typescript
import { createLogger } from '@kitiumai/logger';

const logger = createLogger('dev-setup:cli');
logger.info('Starting setup', { platform, timestamp });
logger.error('Setup failed', { error: message });
```

**Benefits:**

- Structured log entries with metadata
- Contextual logging throughout execution
- Log levels: debug, info, warn, error
- Metrics and health checks support

### 2. Type-Safe Configuration

New types from `src/types.ts` provide compile-time safety:

```typescript
import { DevTool, Editor, type SetupConfig } from '@kitiumai/dev-setup';

const config: SetupConfig = {
  skipTools: [DevTool.Python],
  skipEditors: [Editor.Cursor],
  verbose: true,
  logLevel: 'debug',
};
```

**Available Types:**

- `DevTool` enum - Git, Node, GraphViz, Python
- `Editor` enum - VSCode, Cursor, Antigravity
- `SetupContext` - Internal state management
- `SetupConfig` - CLI options
- `SetupError` - Custom error class with context

### 3. Utility Functions

New utilities from `src/utils.ts` provide:

```typescript
import {
  detectOperatingSystem,
  getPackageManager,
  validateSetupContext,
  createSetupContext,
  formatErrorMessage,
  groupToolsByPriority,
} from '@kitiumai/dev-setup';

const os = detectOperatingSystem();
const manager = getPackageManager(os);
const context = createSetupContext();
```

**Key Utilities:**

- `detectOperatingSystem()` - Returns: 'win32' | 'darwin' | 'linux'
- `getPackageManager()` - Returns appropriate package manager for platform
- `validateSetupContext()` - Runtime validation of setup state
- `createSetupContext()` - Initialize new setup session
- `getPackageManagerInstruction()` - Get installation instructions
- `formatErrorMessage()` - Format errors with context
- `groupToolsByPriority()` - Categorize essential vs optional tools

### 4. Enhanced Error Handling

Custom `SetupError` class with context:

```typescript
throw new SetupError('Installation failed', DevTool.Git, 'win32', ['choco', 'install', 'git']);
```

### 5. Better Task Management

Improved listr2 integration with:

- Proper error context
- Validation at each step
- Task result tracking
- Graceful error recovery

## CLI Command Usage

### Basic Usage

```bash
dev-setup
```

### With Options

```bash
# Verbose logging
dev-setup --verbose

# Skip specific tools (comma-separated)
dev-setup --skip-tools python,graphviz

# Skip specific editors
dev-setup --skip-editors cursor,antigravity

# Interactive mode
dev-setup --interactive

# Combined
dev-setup --verbose --skip-tools python --skip-editors cursor
```

## API Changes

### Before (v0.0.1)

```typescript
// Old: Simple console logging
console.log(chalk.bold.blue('Starting setup'));
```

### After (v1.0.0)

```typescript
// New: Structured logging with context
logger.info('Starting KitiumAI Development Environment Setup', {
  options,
  timestamp: new Date().toISOString(),
});
```

### Untyped Configuration

Before, options were implicit. Now they're type-safe:

```typescript
// Old: Implicit string parsing
const tools = options.skipTools?.split(',');

// New: Type-safe configuration
const config: SetupConfig = {
  skipTools: options.skipTools ? (options.skipTools.split(',') as DevTool[]) : undefined,
  verbose: options.verbose,
};
```

## Testing

Comprehensive unit tests for both utilities and types:

```bash
npm test
```

Tests cover:

- OS detection on all platforms
- Package manager selection
- Setup context validation
- Error message formatting
- Tool prioritization
- Integration scenarios

## Integration with @kitiumai Packages

### @kitiumai/logger v2.0.0

- Creates loggers with context management
- Supports multiple output formats
- Integrates with OpenTelemetry

### @kitiumai/types v2.0.0

- Provides base types for domain models
- Runtime validation with Zod
- Type-safe API contracts

### @kitiumai/utils-ts v2.0.1

- Tree-shakeable utility functions
- Type guards and validation
- Functional programming patterns

### @kitiumai/lint v2.0.0

- ESLint configuration extends base config
- Prettier formatting rules
- TypeScript compiler options

### @kitiumai/config v2.0.0

- Shared configuration presets
- ESLint, Prettier, Jest, Vitest configs
- TypeScript base configurations

## Breaking Changes

1. **Exports** - Now exports types and utilities:
   - `DevTool`, `Editor` enums
   - `SetupError`, `SetupContext`, `SetupConfig` types
   - Utility functions from utils module

2. **CLI Options** - Now type-safe strings:
   - `--skip-tools` expects DevTool enum values
   - `--skip-editors` expects Editor enum values
   - Added `--verbose` and `--interactive` flags

3. **Error Handling** - Custom `SetupError` extends Error with context

## Migration Checklist

- [x] Install latest @kitiumai packages
- [x] Update TypeScript configuration
- [x] Add structured logging throughout
- [x] Create type definitions for configuration
- [x] Add utility functions with validation
- [x] Write comprehensive unit tests
- [x] Update ESLint configuration
- [x] Format code with Prettier
- [x] Document new APIs

## Troubleshooting

### "Cannot find module '@kitiumai/logger'"

Ensure all @kitiumai packages are installed:

```bash
npm install @kitiumai/logger @kitiumai/types @kitiumai/utils-ts
```

### "Module type of file ... is not specified"

Add to package.json:

```json
{
  "type": "module"
}
```

### Tests fail with "vitest not found"

Install dev dependencies:

```bash
npm install --save-dev vitest
```

## Performance Improvements

- Lazy logger initialization
- Efficient context management
- Minimal overhead from type validation
- Tree-shakeable utility functions

## Future Enhancements

- [ ] Interactive setup wizard using inquirer
- [ ] Configuration file support (.dev-setuprc.json)
- [ ] Setup progress persistence
- [ ] Rollback capability for failed installations
- [ ] Integration tests with real installations
- [ ] Docker container support detection
- [ ] Shell-specific detection (bash, zsh, pwsh)
- [ ] Metrics collection and reporting

## Support

For issues or questions:

1. Check this migration guide
2. Review inline code documentation
3. Check @kitiumai package documentation
4. Open an issue in the repository
