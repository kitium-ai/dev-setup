/**
 * Development setup utility functions
 * Pure functions for OS and tool detection, validation
 */

import os from 'os';
import { isString, isNil, isError } from '@kitiumai/utils-ts';
import {
  DevTool,
  Editor,
  type OperatingSystem,
  type PackageManager,
  type SetupContext,
} from './types.js';

/**
 * Detect the current operating system
 */
export function detectOperatingSystem(): OperatingSystem {
  const platform = os.platform();

  if (platform === 'win32' || platform === 'darwin' || platform === 'linux') {
    return platform as OperatingSystem;
  }

  return 'linux';
}

/**
 * Get appropriate package manager for the platform
 */
export function getPackageManager(platform: OperatingSystem): PackageManager | undefined {
  const packageManagers: Record<OperatingSystem, PackageManager> = {
    win32: 'chocolatey',
    darwin: 'homebrew',
    linux: 'apt',
  };

  return packageManagers[platform];
}

/**
 * Validate setup context
 */
export function validateSetupContext(context: unknown): context is SetupContext {
  if (!context || typeof context !== 'object') {
    return false;
  }

  const ctx = context as Record<string, unknown>;
  return (
    isString(ctx.platform) &&
    (!isNil(ctx.packageManager) ? isString(ctx.packageManager) : true) &&
    ctx.installedTools instanceof Set &&
    ctx.installedEditors instanceof Set &&
    Array.isArray(ctx.taskResults)
  );
}

/**
 * Create initial setup context
 */
export function createSetupContext(): SetupContext {
  const platform = detectOperatingSystem();
  const packageManager = getPackageManager(platform);

  return {
    platform,
    packageManager,
    installedTools: new Set(),
    installedEditors: new Set(),
    taskResults: [],
  };
}

/**
 * Get package manager installation instruction
 */
export function getPackageManagerInstruction(
  platform: OperatingSystem
): { name: string; command: string; url: string } | undefined {
  const instructions: Record<
    OperatingSystem,
    { name: string; command: string; url: string } | undefined
  > = {
    win32: {
      name: 'Chocolatey',
      command: 'Run PowerShell as Administrator and execute provided script',
      url: 'https://chocolatey.org/install',
    },
    darwin: {
      name: 'Homebrew',
      command:
        '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
      url: 'https://brew.sh',
    },
    linux: {
      name: 'APT',
      command: 'sudo apt-get update && sudo apt-get install -y',
      url: 'https://wiki.debian.org/Apt',
    },
  };

  return instructions[platform];
}

/**
 * Format error message with context
 */
export function formatErrorMessage(
  error: unknown,
  tool?: DevTool | Editor,
  platform?: OperatingSystem
): string {
  if (isError(error)) {
    const message = error.message;
    if (tool && platform) {
      return `Failed to install ${tool} on ${platform}: ${message}`;
    }
    return message;
  }

  return 'An unknown error occurred';
}

/**
 * Create a safe async wrapper for command execution
 */
export async function safeExecuteCommand<T>(
  fn: () => Promise<T>,
  fallback: T,
  _context?: { tool?: DevTool | Editor; platform?: OperatingSystem }
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/**
 * Validate that required tools are available
 */
export function isToolAvailable(_toolName: string): boolean {
  try {
    // This would typically check if a command is available in PATH
    // For now, we'll return true - actual implementation would use execa
    return true;
  } catch {
    return false;
  }
}

/**
 * Group tools by category
 */
export function groupToolsByPriority(tools: DevTool[]): {
  essential: DevTool[];
  optional: DevTool[];
} {
  const essential = [DevTool.Git, DevTool.Node];
  return {
    essential: tools.filter((t) => essential.includes(t)),
    optional: tools.filter((t) => !essential.includes(t)),
  };
}
