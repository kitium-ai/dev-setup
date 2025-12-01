/**
 * Centralized error handling with KitiumError factory functions
 * Provides structured error types for dev-setup operations
 */

import { KitiumError, type ErrorSeverity } from '@kitiumai/error';

/**
 * Error metadata for structured logging and error tracking
 */
export interface ErrorMetadata {
  code: string;
  kind: string;
  severity: ErrorSeverity;
  statusCode: number;
  retryable: boolean;
  help?: string;
  docs?: string;
}

/**
 * Extract error metadata from KitiumError for logging
 */
export function extractErrorMetadata(error: unknown): ErrorMetadata {
  if (error instanceof KitiumError) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kitiumError = error as any;
    return {
      code: kitiumError.code,
      kind: kitiumError.kind,
      severity: kitiumError.severity,
      statusCode: kitiumError.statusCode,
      retryable: kitiumError.retryable,
      help: kitiumError.help,
      docs: kitiumError.docs,
    };
  }

  return {
    code: 'devsetup/unknown',
    kind: 'unknown',
    severity: 'error',
    statusCode: 500,
    retryable: false,
  };
}

/**
 * Setup context validation error
 */
export function createSetupContextError(
  reason: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'devsetup/context',
    message: `Setup context validation failed: ${reason}`,
    statusCode: 400,
    severity: 'error',
    kind: 'context_error',
    retryable: false,
    help: 'Ensure the system meets minimum requirements for development setup',
    docs: 'https://docs.kitium.ai/errors/devsetup/context',
    context: { reason, ...context },
  });
}

/**
 * Operating system detection error
 */
export function createOSDetectionError(
  reason: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'devsetup/os-detection',
    message: `Operating system detection failed: ${reason}`,
    statusCode: 500,
    severity: 'error',
    kind: 'os_detection_error',
    retryable: true,
    help: 'Try running the setup again or check your system configuration',
    docs: 'https://docs.kitium.ai/errors/devsetup/os-detection',
    context: { reason, ...context },
  });
}

/**
 * Package manager detection or installation error
 */
export function createPackageManagerError(
  operation: string,
  manager: string,
  reason: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'devsetup/package-manager',
    message: `Package manager operation failed: ${operation} (${manager}) - ${reason}`,
    statusCode: 503,
    severity: 'warning',
    kind: 'package_manager_error',
    retryable: true,
    help: `Install ${manager} manually or check the documentation at https://docs.kitium.ai/setup`,
    docs: 'https://docs.kitium.ai/errors/devsetup/package-manager',
    context: { operation, manager, reason, ...context },
  });
}

/**
 * Tool installation error
 */
export function createToolInstallationError(
  tool: string,
  platform: string,
  reason: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'devsetup/tool-installation',
    message: `Failed to install ${tool} on ${platform}: ${reason}`,
    statusCode: 422,
    severity: 'warning',
    kind: 'tool_installation_error',
    retryable: true,
    help: `Try installing ${tool} manually or check system permissions and disk space`,
    docs: 'https://docs.kitium.ai/errors/devsetup/tool-installation',
    context: { tool, platform, reason, ...context },
  });
}

/**
 * Editor installation error
 */
export function createEditorInstallationError(
  editor: string,
  platform: string,
  reason: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'devsetup/editor-installation',
    message: `Failed to install ${editor} on ${platform}: ${reason}`,
    statusCode: 422,
    severity: 'warning',
    kind: 'editor_installation_error',
    retryable: true,
    help: `Install ${editor} manually from the official website`,
    docs: 'https://docs.kitium.ai/errors/devsetup/editor-installation',
    context: { editor, platform, reason, ...context },
  });
}

/**
 * Command execution error
 */
export function createCommandExecutionError(
  command: string,
  exitCode: number,
  stderr?: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'devsetup/command-execution',
    message: `Command failed: ${command} (exit code: ${exitCode})${stderr ? ` - ${stderr.slice(0, 100)}` : ''}`,
    statusCode: 422,
    severity: 'warning',
    kind: 'command_execution_error',
    retryable: true,
    help: 'Check that all required tools are installed and accessible in your PATH',
    docs: 'https://docs.kitium.ai/errors/devsetup/command-execution',
    context: { command, exitCode, stderr, ...context },
  });
}

/**
 * Tool availability check error
 */
export function createToolUnavailableError(
  tool: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'devsetup/tool-unavailable',
    message: `Required tool not available: ${tool}`,
    statusCode: 503,
    severity: 'error',
    kind: 'tool_unavailable_error',
    retryable: true,
    help: `Install ${tool} and ensure it is available in your system PATH`,
    docs: 'https://docs.kitium.ai/errors/devsetup/tool-unavailable',
    context: { tool, ...context },
  });
}

/**
 * Configuration error
 */
export function createConfigurationError(
  field: string,
  reason: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'devsetup/configuration',
    message: `Configuration error in field '${field}': ${reason}`,
    statusCode: 400,
    severity: 'error',
    kind: 'configuration_error',
    retryable: false,
    help: 'Check your setup configuration and CLI arguments',
    docs: 'https://docs.kitium.ai/errors/devsetup/configuration',
    context: { field, reason, ...context },
  });
}

/**
 * Backward compatibility error classes
 * These are kept for gradual migration to KitiumError
 */

export class SetupContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SetupContextError';
  }
}

export class OSDetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OSDetectionError';
  }
}

export class PackageManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PackageManagerError';
  }
}

export class ToolInstallationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolInstallationError';
  }
}

export class EditorInstallationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EditorInstallationError';
  }
}

export class CommandExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandExecutionError';
  }
}
