/**
 * @kitiumai/dev-setup type definitions
 * Enterprise-ready types for development environment setup
 */

/**
 * Supported operating systems
 */
export type OperatingSystem = 'win32' | 'darwin' | 'linux';

/**
 * Package manager types
 */
export type PackageManager = 'chocolatey' | 'homebrew' | 'apt' | 'brew';

/**
 * Core development tools
 */
export enum DevTool {
  Git = 'git',
  Node = 'node',
  GraphViz = 'graphviz',
  Python = 'python',
}

/**
 * IDE/Editor options
 */
export enum Editor {
  VSCode = 'vscode',
  Cursor = 'cursor',
  Antigravity = 'antigravity',
}

/**
 * Setup task result
 */
export interface SetupTaskResult {
  name: string;
  status: 'success' | 'skipped' | 'failed';
  message?: string;
  error?: Error;
}

/**
 * Setup context for managing state during installation
 */
export interface SetupContext {
  platform: OperatingSystem;
  packageManager?: PackageManager;
  installedTools: Set<DevTool>;
  installedEditors: Set<Editor>;
  taskResults: SetupTaskResult[];
}

/**
 * Setup configuration options
 */
export interface SetupConfig {
  skipTools?: DevTool[];
  skipEditors?: Editor[];
  interactive?: boolean;
  verbose?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Installation instruction for a tool
 */
export interface ToolInstruction {
  tool: DevTool | Editor;
  platform: OperatingSystem;
  packageManager?: PackageManager;
  command: string[];
  description: string;
  manualUrl?: string;
}

/**
 * Setup error with context information
 *
 * @example
 * ```ts
 * throw new SetupError('Installation failed', DevTool.Git, 'win32', ['choco', 'install', 'git']);
 * ```
 */
export class SetupError extends Error {
  /**
   * Create a new SetupError with optional context
   *
   * @param message - Error message describing what went wrong
   * @param tool - Optional tool or editor that caused the error
   * @param platform - Optional platform where the error occurred
   * @param command - Optional command that was being executed
   */
  constructor(
    message: string,
    readonly tool?: DevTool | Editor,
    readonly platform?: OperatingSystem,
    readonly command?: string[]
  ) {
    super(message);
    this.name = 'SetupError';
  }
}
